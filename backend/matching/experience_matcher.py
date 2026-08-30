from __future__ import annotations

from typing import Optional

_LEVEL_MAP = {
    "junior": 1,
    "mid": 2,
    "senior": 3,
    "lead": 4,
}


def _level_to_int(level: Optional[str]) -> Optional[int]:
    if not level:
        return None
    return _LEVEL_MAP.get(level.lower().strip())


def _years_to_level(years: Optional[int]) -> Optional[str]:
    if years is None:
        return None
    if years <= 2:
        return "junior"
    elif years <= 5:
        return "mid"
    elif years <= 8:
        return "senior"
    else:
        return "lead"


def match_experience(
    candidate_level: Optional[str],
    candidate_years: Optional[int],
    job_seniority: Optional[str],
) -> Optional[float]:
    c_level = _level_to_int(candidate_level)
    j_level = _level_to_int(job_seniority)

    if c_level is None and candidate_years is not None:
        inferred = _years_to_level(candidate_years)
        c_level = _level_to_int(inferred)

    if c_level is None and j_level is None:
        return None

    if c_level is None:
        c_level = 1

    if j_level is None:
        return 70.0

    diff = abs(c_level - j_level)
    if diff == 0:
        return 100.0
    elif diff == 1:
        return 70.0
    elif diff == 2:
        return 30.0
    else:
        return 0.0
