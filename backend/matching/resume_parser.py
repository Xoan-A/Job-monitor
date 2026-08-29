from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Tuple

from ..models import CandidateProfile, Language
from .skill_extractor import get_extractor, EXPERIENCE_LEVELS
from .skill_normalizer import get_normalizer

logger = logging.getLogger(__name__)


def parse_resume(pdf_bytes: bytes) -> CandidateProfile:
    text = _extract_pdf_text(pdf_bytes)
    if not text.strip():
        raise ValueError("Could not extract text from PDF")

    profile = _parse_text(text)
    return profile


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        import fitz
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        doc.close()
        return "\n".join(text_parts)
    except ImportError:
        logger.warning("PyMuPDF not available, trying pdfplumber")
        return _extract_with_pdfplumber(pdf_bytes)
    except Exception as e:
        logger.warning("PyMuPDF failed (%s), trying pdfplumber", e)
        return _extract_with_pdfplumber(pdf_bytes)


def _extract_with_pdfplumber(pdf_bytes: bytes) -> str:
    try:
        import pdfplumber
        import io
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n".join(text_parts)
    except ImportError:
        raise ImportError("Neither PyMuPDF nor pdfplumber is installed")
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}")


def _parse_text(text: str) -> CandidateProfile:
    normalizer = get_normalizer()
    extractor = get_extractor()

    sections = _split_sections(text)
    skills = _extract_skills(text, extractor, normalizer)
    roles = _extract_roles(text, sections)
    experience_level, years = _extract_experience(text, sections)
    education = _extract_education(text, sections)
    languages = _extract_languages(text)

    return CandidateProfile(
        raw_text=text[:10000],
        skills=skills,
        roles=roles,
        experience_level=experience_level,
        years_experience=years,
        education=education,
        languages=languages,
    )


def _split_sections(text: str) -> Dict[str, str]:
    section_headers = [
        r"(?i)^(experiencia|experience|work\s+experience|employment|historial\s+laboral)",
        r"(?i)^(educación|education|formación\s+académica|academic)",
        r"(?i)^(habilidades|skills|competencias|technical\s+skills|tech\s+skills)",
        r"(?i)^(proyectos|projects|portfolio)",
        r"(?i)^(certificaciones|certifications|certificados)",
        r"(?i)^(idiomas|languages|linguas)",
        r"(?i)^(resumen|summary|profile|about|objective|objetivo|perfil)",
        r"(?i)^(intereses|interests)",
    ]
    patterns = [re.compile(h, re.MULTILINE) for h in section_headers]
    lines = text.split("\n")
    sections = {}
    current_section = "header"
    current_content = []

    for line in lines:
        stripped = line.strip()
        matched = False
        for pattern in patterns:
            m = pattern.match(stripped)
            if m:
                if current_content:
                    sections[current_section] = "\n".join(current_content)
                current_section = m.group(1).lower().split()[0]
                current_content = []
                matched = True
                break
        if not matched and stripped:
            current_content.append(line)

    if current_content:
        sections[current_section] = "\n".join(current_content)

    return sections


def _extract_skills(text: str, extractor, normalizer) -> List[str]:
    skills = extractor.extract_from_text(text)
    return sorted(set(normalizer.normalize(s) for s in skills))


def _extract_roles(text: str, sections: Dict[str, str]) -> List[str]:
    roles = []
    role_patterns = [
        r"(?i)(?:desarrollador|developer|engineer|ingeniero|architect|arquitecto|"
        r"analyst|analista|designer|diseñador|lead|manager|gerente|"
        r"consultant|consultor|specialist|especialista|"
        r"full[\s-]?stack|frontend|front[\s-]?end|backend|back[\s-]?end|"
        r"devops|data\s+scientist|ml\s+engineer|product\s+owner|scrum\s+master)"
    ]
    combined_text = text[:3000]
    for pattern in role_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        for m in matches:
            normalized = normalizer.normalize(m.strip())
            if normalized and normalized not in roles:
                roles.append(normalized)

    if not roles:
        for line in text.split("\n")[:20]:
            line_lower = line.lower().strip()
            if any(w in line_lower for w in ["developer", "engineer", "architect", "analyst",
                                               "desarrollador", "ingeniero", "arquitecto"]):
                words = line.strip().split()
                if 2 <= len(words) <= 6:
                    role = " ".join(words[:4])
                    normalized = normalizer.normalize(role)
                    if normalized:
                        roles.append(normalized)
                break

    return roles[:5]


def _extract_experience(text: str, sections: Dict[str, str]) -> Tuple[Optional[str], Optional[int]]:
    level = None
    for marker, lvl in EXPERIENCE_LEVELS.items():
        if marker in text.lower():
            level = lvl
            break

    years = None
    year_patterns = [
        r"(\d+)\s*(?:años?|years?)\s*(?:de\s+)?(?:experiencia|experience)",
        r"(?:experiencia|experience)[:\s]*(\d+)\s*(?:años?|years?)",
        r"(\d+)\+?\s*(?:years?|años?)\s*(?:of\s+)?(?:experience|experiencia)",
    ]
    for pattern in year_patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            years = int(m.group(1))
            break

    if years is not None and level is None:
        if years <= 2:
            level = "junior"
        elif years <= 5:
            level = "mid"
        elif years <= 8:
            level = "senior"
        else:
            level = "lead"

    return level, years


def _extract_education(text: str, sections: Dict[str, str]) -> List[Dict]:
    education = []
    degree_patterns = [
        r"(?i)(ph\.?d\.?|doctorado|doctorate)",
        r"(?i)(master|maestría|maestría|m\.?s\.?|m\.?a\.?)",
        r"(?i)(licenciatura|bachelor|degree|b\.?s\.?|b\.?a\.?|ingeniería)",
        r"(?i)(tecnólogo|technologist|associate|tecnico)",
        r"(?i)(diplomado|diploma|certificate|certificación)",
    ]
    field_pattern = re.compile(
        r"(?i)(?:en|in|de)\s+([\w\s]+?)(?:\s*[,.\n]|\s*$)",
        re.MULTILINE
    )

    for line in text.split("\n"):
        for pattern in degree_patterns:
            m = re.search(pattern, line)
            if m:
                degree = m.group(1).strip()
                field_match = field_pattern.search(line)
                field = field_match.group(1).strip() if field_match else ""
                education.append({
                    "degree": degree,
                    "field": field,
                    "raw": line.strip()[:200],
                })
                break

    return education[:5]


def _extract_languages(text: str) -> List[Language]:
    languages = []
    lang_names = {
        "english": "English", "español": "Spanish", "spanish": "Spanish",
        "portuguese": "Portuguese", "portugués": "Portuguese",
        "french": "French", "francés": "French",
        "german": "German", "alemán": "German",
        "italian": "Italian", "italiano": "Italian",
        "chinese": "Chinese", "chino": "Chinese",
        "japanese": "Japanese", "japonés": "Japanese",
        "korean": "Korean", "coreano": "Korean",
        "arabic": "Arabic", "árabe": "Arabic",
    }
    level_markers = {
        "native": "Native", "nativo": "Native", "materno": "Native",
        "fluent": "Fluent", "fluido": "Fluent",
        "advanced": "C1", "avanzado": "C1",
        "intermediate": "B1", "intermedio": "B1",
        "basic": "A2", "básico": "A2", "basico": "A2",
        "c1": "C1", "c2": "C2", "b2": "B2", "b1": "B1", "a1": "A1", "a2": "A2",
    }

    for line in text.split("\n"):
        line_lower = line.lower()
        for lang_name, lang_display in lang_names.items():
            if lang_name in line_lower:
                level = None
                for marker, lvl in level_markers.items():
                    if marker in line_lower:
                        level = lvl
                        break
                languages.append(Language(language=lang_display, level=level))
                break

    seen = set()
    unique = []
    for lang in languages:
        key = (lang.language, lang.level)
        if key not in seen:
            seen.add(key)
            unique.append(lang)
    return unique
