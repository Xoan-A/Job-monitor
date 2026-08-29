from __future__ import annotations

from typing import List, Optional

from .skill_normalizer import get_normalizer


def match_roles(
    candidate_roles: List[str],
    job_role_keywords: List[str],
) -> Optional[float]:
    if not candidate_roles and not job_role_keywords:
        return None
    if not candidate_roles or not job_role_keywords:
        return 50.0

    normalizer = get_normalizer()
    cand_normalized = set()
    for role in candidate_roles:
        cand_normalized.add(normalizer.normalize(role.lower()))
        cand_normalized.add(role.lower())

    job_normalized = set()
    for kw in job_role_keywords:
        job_normalized.add(normalizer.normalize(kw.lower()))
        job_normalized.add(kw.lower())

    exact = 0
    partial = 0
    for j_kw in job_normalized:
        if j_kw in cand_normalized:
            exact += 1
        else:
            for c_role in cand_normalized:
                if j_kw in c_role or c_role in j_kw:
                    partial += 1
                    break

    total = len(job_normalized)
    if total == 0:
        return 50.0

    score = (exact * 1.0 + partial * 0.6) / total * 100
    return min(100.0, max(0.0, score))


def extract_job_role_keywords(title: str, role_keywords: Optional[List[str]] = None) -> List[str]:
    if not title:
        return role_keywords or []

    keywords = set(role_keywords or [])
    title_lower = title.lower()
    role_words = [
        "developer", "engineer", "architect", "lead", "manager",
        "analyst", "designer", "consultant", "specialist", "director",
        "devops", "sre", "fullstack", "full-stack", "frontend", "backend",
        "mobile", "backend", "qa", "data", "ml", "ai",
        "desarrollador", "ingeniero", "arquitecto", "analista",
        "diseñador", "consultor", "especialista", "líder",
    ]
    for word in role_words:
        if word in title_lower:
            keywords.add(word)
    return sorted(keywords)
