from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from ..models import CandidateProfile, Language
from .skill_extractor import get_extractor
from .skill_normalizer import get_normalizer

logger = logging.getLogger(__name__)

MONTH_MAP = {
    "jan": 1, "january": 1, "enero": 1,
    "feb": 2, "february": 2, "febrero": 2,
    "mar": 3, "march": 3, "marzo": 3,
    "apr": 4, "april": 4, "abril": 4,
    "may": 5, "mayo": 5,
    "jun": 6, "june": 6, "junio": 6,
    "jul": 7, "july": 7, "julio": 7,
    "aug": 8, "august": 8, "agosto": 8,
    "sep": 9, "sept": 9, "september": 9, "septiembre": 9, "setiembre": 9,
    "oct": 10, "october": 10, "octubre": 10,
    "nov": 11, "november": 11, "noviembre": 11,
    "dec": 12, "december": 12, "diciembre": 12,
    "ene": 1, "feb": 2, "mar": 3, "abr": 4,
    "may": 5, "jun": 6, "jul": 7, "ago": 8,
    "oct": 10, "nov": 11, "dic": 12,
}

MONTH_NAMES_RE = "|".join(sorted(MONTH_MAP.keys(), key=len, reverse=True))

PRESENT_KEYWORDS = {"present", "current", "presente", "actualidad", "actualmente", "hoy", "至今"}

DATE_PART = rf"(?:{MONTH_NAMES_RE})[\s.,]{{0,3}}\d{{4}}|\d{{1,2}}[\/\-\.]\d{{4}}|\d{{4}}[\/\-\.]\d{{1,2}}|\d{{4}}"

SEPARATORS = r"\s*[-–—to+a]+\s*(?:de\s+)?(?:a|al|hasta)?\s*"

DATE_RANGE_RE = re.compile(
    rf"(?P<start>{DATE_PART}){SEPARATORS}(?P<end>{DATE_PART}|{'|'.join(PRESENT_KEYWORDS)})",
    re.IGNORECASE,
)

WORK_SECTION_RE = re.compile(
    r"(?i)^\s*(?:experiencia\s+(?:laboral|profesional)|"
    r"work\s+experience|employment(?:\s+history)?|"
    r"professional\s+experience|historial\s+laboral|"
    r"trayectoria\s+profesional|empleo)",
    re.MULTILINE,
)

ALL_SECTIONS_RE = re.compile(
    r"(?i)^\s*(?:experiencia|experience|employment|historial|trayectoria|empleo|"
    r"educación|education|formación|academica|academic|"
    r"habilidades|skills|competencias|technical|"
    r"proyectos|projects|portfolio|portafolio|"
    r"certificaciones|certifications|certificados|"
    r"idiomas|languages|linguas|"
    r"resumen|summary|profile|about|objective|objetivo|perfil|"
    r"intereses|interests|contacto|contact)",
    re.MULTILINE,
)


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
    normalizer = get_normalizer()
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


def _parse_date(date_str: str) -> Optional[Tuple[int, int]]:
    s = date_str.strip().lower().replace(".", "").replace("de ", " ").replace("  ", " ")
    if any(kw in s for kw in PRESENT_KEYWORDS):
        return None
    for name, num in MONTH_MAP.items():
        if name in s:
            ym = re.search(r"\d{4}", s)
            if ym:
                return (int(ym.group()), num)
            return None
    m = re.match(r"(\d{1,2})[\/\-\.](\d{4})", s)
    if m:
        return (int(m.group(2)), int(m.group(1)))
    m = re.match(r"(\d{4})[\/\-\.](\d{1,2})", s)
    if m:
        return (int(m.group(1)), int(m.group(2)))
    ym = re.search(r"(\d{4})", s)
    if ym:
        return (int(ym.group(1)), None)
    return None


def _date_to_months(d: Optional[Tuple[int, int]], use_end: bool = False) -> int:
    if d is None:
        now = datetime.now()
        return now.year * 12 + now.month
    year, month = d
    if month is None:
        month = 12 if use_end else 1
    return year * 12 + month


def _merge_intervals(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    if not intervals:
        return []
    intervals.sort()
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def _get_work_section(text: str) -> Optional[str]:
    m = WORK_SECTION_RE.search(text)
    if not m:
        return None
    start = m.end()
    rest = text[start:]
    boundary = ALL_SECTIONS_RE.search(rest)
    if boundary:
        return rest[:boundary.start()]
    return rest


def _extract_experience(text: str, sections: Dict[str, str]) -> Tuple[Optional[str], Optional[int]]:
    level = _detect_level_from_title(text)

    work_text = _get_work_section(text)
    years = None

    if work_text:
        date_ranges = DATE_RANGE_RE.findall(work_text)
        intervals = []
        for start_str, end_str in date_ranges:
            start_d = _parse_date(start_str)
            end_d = _parse_date(end_str)
            if start_d is None:
                continue
            s = _date_to_months(start_d, use_end=False)
            e = _date_to_months(end_d, use_end=True)
            if e >= s:
                intervals.append((s, e))
        merged = _merge_intervals(intervals)
        total_months = sum(end - start for start, end in merged)
        years = round(total_months / 12) if total_months > 0 else None

    if years is None:
        year_explicit = _find_explicit_years(text)
        if year_explicit is not None:
            years = year_explicit
            if level is None:
                if years <= 2:
                    level = "junior"
                elif years <= 5:
                    level = "mid"
                elif years <= 8:
                    level = "senior"
                else:
                    level = "lead"

    return level, years


def _detect_level_from_title(text: str) -> Optional[str]:
    title_patterns = [
        (r"\b(?:junior|júnior|entry[\s-]level|trainee|practicante|intern|becario)\b", "junior"),
        (r"\b(?:semi[\s-]senior|semi-senior)\b", "mid"),
        (r"\b(?:senior|sr\.?)\b", "senior"),
        (r"\b(?:lead|principal|staff|architect)\b", "lead"),
    ]
    for line in text.split("\n")[:15]:
        line_lower = line.lower().strip()
        if any(w in line_lower for w in [
            "developer", "engineer", "analista", "analyst",
            "architect", "designer", "desarrollador", "ingeniero",
            "manager", "lead", "consultant", "specialist",
        ]):
            for pattern, lvl in title_patterns:
                if re.search(pattern, line_lower):
                    return lvl
            break
    return None


def _find_explicit_years(text: str) -> Optional[int]:
    patterns = [
        r"(\d+)\s*(?:años?|years?)\s*(?:de\s+)?(?:experiencia|experience)",
        r"(?:experiencia|experience)[:\s]*(\d+)\s*(?:años?|years?)",
        r"(\d+)\+?\s*(?:years?|años?)\s*(?:of\s+)?(?:experience|experiencia)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


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
