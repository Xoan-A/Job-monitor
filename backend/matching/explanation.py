from __future__ import annotations

from typing import List, Optional

from ..models import MatchRelated


def generate_explanation(
    final_score: Optional[float],
    exact_matches: List[str],
    related_matches: List[MatchRelated],
    gaps: List[str],
    candidate_level: Optional[str] = None,
    job_seniority: Optional[str] = None,
) -> Optional[str]:
    if final_score is None:
        return None

    parts = []

    if exact_matches:
        if len(exact_matches) >= 3:
            skills_str = ", ".join(exact_matches[:5])
            parts.append(f"Strong alignment with core technologies: {skills_str}.")
        elif len(exact_matches) >= 1:
            skills_str = ", ".join(exact_matches)
            parts.append(f"Direct match on {skills_str}.")

    if related_matches:
        if len(related_matches) == 1:
            rm = related_matches[0]
            parts.append(f"Your {rm.source} experience relates to their {rm.target} requirement.")
        elif len(related_matches) > 1:
            pairs = [f"{rm.source}→{rm.target}" for rm in related_matches[:3]]
            parts.append(f"Related technology matches: {', '.join(pairs)}.")

    significant_gaps = [g for g in gaps if not _is_generic(g)]
    if significant_gaps:
        if len(significant_gaps) == 1:
            parts.append(f"The main gap is {significant_gaps[0]}.")
        elif len(significant_gaps) <= 3:
            parts.append(f"Identified gaps: {', '.join(significant_gaps)}.")
        else:
            parts.append(f"Several gaps including {', '.join(significant_gaps[:3])}.")

    if not parts:
        if final_score >= 70:
            parts.append("Good overall match based on available information.")
        elif final_score >= 50:
            parts.append("Moderate alignment with the position requirements.")
        else:
            parts.append("Limited overlap with the listed requirements.")

    return " ".join(parts)


def _is_generic(skill: str) -> bool:
    generic = {"Git", "REST", "HTTP", "SQL", "HTML", "CSS", "Agile", "Scrum", "Docker", "Linux"}
    return skill in generic
