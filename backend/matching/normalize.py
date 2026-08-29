from __future__ import annotations

import logging
from typing import Optional

from ..models import CandidateProfile, JobNormalized
from .skill_extractor import get_extractor
from .skill_normalizer import get_normalizer
from .embeddings import generate_embedding

logger = logging.getLogger(__name__)


def normalize_job(job_id: int, title: str, tags: Optional[list], description: Optional[str]) -> JobNormalized:
    extractor = get_extractor()
    normalizer = get_normalizer()

    all_skills = set()
    if tags:
        all_skills.update(extractor.extract_from_tags(tags))
    if title:
        all_skills.update(extractor.extract_from_text(title))
    if description:
        all_skills.update(extractor.extract_from_text(description[:4000]))

    required, preferred = [], []
    if description:
        required, preferred = extractor.extract_required_vs_preferred(description[:6000])

    if not required:
        required = sorted(all_skills)
    if not preferred:
        preferred = []

    seniority = extractor.extract_seniority(title, description)
    role_keywords = extractor.extract_role_keywords(title)

    return JobNormalized(
        job_id=job_id,
        required_skills=required,
        preferred_skills=preferred,
        all_skills=sorted(all_skills),
        role_keywords=role_keywords,
        seniority=seniority,
    )


def generate_job_embedding(normalized: JobNormalized, title: str = "", description: Optional[str] = None) -> Optional[bytes]:
    parts = []
    if normalized.all_skills:
        parts.append("Skills: " + ", ".join(normalized.all_skills))
    if normalized.role_keywords:
        parts.append("Roles: " + ", ".join(normalized.role_keywords))
    if normalized.seniority:
        parts.append(f"Level: {normalized.seniority}")
    if title:
        parts.append(f"Title: {title}")
    if description:
        parts.append(f"Description: {description[:2000]}")
    text = " | ".join(parts)
    if not text.strip():
        return None
    return generate_embedding(text)


def generate_profile_embedding(profile: CandidateProfile) -> Optional[bytes]:
    parts = []
    if profile.skills:
        parts.append("Skills: " + ", ".join(profile.skills))
    if profile.roles:
        parts.append("Roles: " + ", ".join(profile.roles))
    if profile.experience_level:
        parts.append(f"Level: {profile.experience_level}")
    if profile.years_experience is not None:
        parts.append(f"Years: {profile.years_experience}")
    if profile.education:
        for edu in profile.education:
            if isinstance(edu, dict):
                degree = edu.get("degree", "")
                field = edu.get("field", "")
                if degree:
                    parts.append(f"Education: {degree} {field}".strip())
    text = " | ".join(parts)
    if not text.strip():
        return None
    return generate_embedding(text)
