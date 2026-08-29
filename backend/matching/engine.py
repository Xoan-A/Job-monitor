from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from ..models import CandidateProfile, JobNormalized, JobMatch
from .skill_matcher import get_skill_matcher
from .embeddings import generate_embedding, cosine_similarity
from .experience_matcher import match_experience
from .role_matcher import match_roles
from .score_calculator import calculate_score
from .explanation import generate_explanation

logger = logging.getLogger(__name__)


def compute_match(
    profile: CandidateProfile,
    profile_embedding: Optional[bytes],
    job_normalized: JobNormalized,
    job_embedding: Optional[bytes],
) -> JobMatch:
    matcher = get_skill_matcher()

    req_score, req_exact, req_related, req_gaps = matcher.match_skills(
        profile.skills, job_normalized.required_skills
    )

    pref_score, pref_exact, pref_related, pref_gaps = matcher.match_skills(
        profile.skills, job_normalized.preferred_skills
    )

    sem_score = cosine_similarity(profile_embedding, job_embedding)

    exp_score = match_experience(
        profile.experience_level,
        profile.years_experience,
        job_normalized.seniority,
    )

    role_score = match_roles(
        profile.roles, job_normalized.role_keywords
    )

    final = calculate_score(
        required_score=req_score,
        preferred_score=pref_score,
        semantic_score=sem_score,
        experience_score=exp_score,
        role_score=role_score,
    )

    all_exact = list(set(req_exact + pref_exact))
    all_related = list(set(
        (r.source, r.target, r.confidence)
        for r in req_related + pref_related
    ))
    from ..models import MatchRelated
    related_objs = [MatchRelated(source=s, target=t, confidence=c) for s, t, c in all_related]
    all_gaps = list(set(req_gaps))

    explanation = generate_explanation(
        final_score=final,
        exact_matches=all_exact,
        related_matches=related_objs,
        gaps=all_gaps,
        candidate_level=profile.experience_level,
        job_seniority=job_normalized.seniority,
    )

    now = datetime.now(timezone.utc).isoformat()
    return JobMatch(
        job_id=job_normalized.job_id,
        profile_id=profile.id,
        profile_version=profile.version,
        final_score=final,
        required_score=req_score,
        preferred_score=pref_score,
        semantic_score=sem_score,
        experience_score=exp_score,
        role_score=role_score,
        exact_matches=all_exact,
        related_matches=related_objs,
        gaps=all_gaps,
        explanation=explanation,
        analyzed_at=now,
    )
