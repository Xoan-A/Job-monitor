from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional, Tuple

from .skill_normalizer import get_normalizer
from .skill_relationships import get_relationships
from ..models import MatchRelated

logger = logging.getLogger(__name__)


class SkillMatcher:
    def __init__(self):
        self._normalizer = get_normalizer()
        self._relationships = get_relationships()

    def match_skills(
        self,
        candidate_skills: List[str],
        job_skills: List[str],
    ) -> Tuple[float, List[str], List[MatchRelated], List[str]]:
        if not candidate_skills and not job_skills:
            return 0.0, [], [], []
        if not job_skills:
            return 0.0, [], [], []

        cand_set = set(candidate_skills)
        job_set = set(job_skills)
        exact_matches = []
        related_matches = []
        gaps = []

        for job_skill in job_skills:
            if job_skill in cand_set:
                exact_matches.append(job_skill)
                continue
            best_related = None
            best_confidence = 0.0
            related_to_job = self._relationships.get_related(job_skill)
            for related_skill, confidence in related_to_job:
                if related_skill in cand_set and confidence > best_confidence:
                    best_related = related_skill
                    best_confidence = confidence
            if best_related:
                related_matches.append(MatchRelated(
                    source=best_related,
                    target=job_skill,
                    confidence=best_confidence,
                ))
            else:
                gaps.append(job_skill)

        total = len(job_skills)
        if total == 0:
            return 0.0, [], [], []

        exact_weight = 1.0
        related_weights = {0.85: 0.85, 0.70: 0.70, 0.60: 0.60, 0.55: 0.55, 0.50: 0.50, 0.45: 0.45, 0.40: 0.40, 0.35: 0.35, 0.30: 0.30}
        score = 0.0
        score += len(exact_matches) * exact_weight
        for rm in related_matches:
            score += related_weights.get(rm.confidence, rm.confidence * 0.5)
        normalized = min(100.0, (score / total) * 100)

        return normalized, exact_matches, related_matches, gaps

    def find_job_skills(
        self,
        tags: Optional[List[str]],
        title: str,
        description: Optional[str] = None,
    ) -> List[str]:
        from .skill_extractor import get_extractor
        extractor = get_extractor()
        skills = set()
        if tags:
            skills.update(extractor.extract_from_tags(tags))
        if title:
            skills.update(extractor.extract_from_text(title))
        if description:
            desc_skills = extractor.extract_from_text(description[:4000])
            skills.update(desc_skills)
        return sorted(skills)


_matcher: Optional[SkillMatcher] = None


def get_skill_matcher() -> SkillMatcher:
    global _matcher
    if _matcher is None:
        _matcher = SkillMatcher()
    return _matcher
