from __future__ import annotations

from typing import Dict, Optional


DEFAULT_WEIGHTS = {
    "required_skills": 0.40,
    "preferred_skills": 0.15,
    "semantic": 0.20,
    "experience": 0.15,
    "role": 0.10,
}


def calculate_score(
    required_score: Optional[float] = None,
    preferred_score: Optional[float] = None,
    semantic_score: Optional[float] = None,
    experience_score: Optional[float] = None,
    role_score: Optional[float] = None,
    weights: Optional[Dict[str, float]] = None,
) -> Optional[float]:
    w = weights or DEFAULT_WEIGHTS
    components = {
        "required_skills": required_score,
        "preferred_skills": preferred_score,
        "semantic": semantic_score,
        "experience": experience_score,
        "role": role_score,
    }
    available = {k: v for k, v in components.items() if v is not None}
    if not available:
        return None

    total_weight = sum(w.get(k, 0) for k in available)
    if total_weight == 0:
        return None

    score = sum(
        (w.get(k, 0) / total_weight) * v
        for k, v in available.items()
    )
    return round(min(100.0, max(0.0, score)), 1)


def score_label(score: Optional[float]) -> Optional[str]:
    if score is None:
        return None
    if score >= 85:
        return "Excellent match"
    elif score >= 70:
        return "Strong match"
    elif score >= 50:
        return "Moderate match"
    elif score >= 30:
        return "Weak match"
    else:
        return "Low match"
