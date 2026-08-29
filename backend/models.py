from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Job:
    id: int
    title: str
    url: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    country: Optional[str] = None
    published_at: Optional[str] = None
    modality: Optional[str] = None
    channel: Optional[str] = None
    subchannel: Optional[str] = None
    is_confidential: bool = False
    is_featured: bool = False
    company_id: Optional[int] = None
    source: str = "buscojobs"
    salary: Optional[str] = None
    job_type: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    experience_level: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ScrapeResult:
    jobs: list[Job] = field(default_factory=list)
    total: int = 0
    pages: int = 0
    source: str = "api"
    new_jobs: int = 0
    updated_jobs: int = 0

    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "total": self.total,
            "pages": self.pages,
            "jobs": [job.to_dict() for job in self.jobs],
            "new_jobs": self.new_jobs,
            "updated_jobs": self.updated_jobs,
        }


@dataclass
class Language:
    language: str
    level: Optional[str] = None


@dataclass
class CandidateProfile:
    id: int = 0
    version: int = 1
    raw_text: str = ""
    skills: List[str] = field(default_factory=list)
    roles: List[str] = field(default_factory=list)
    experience_level: Optional[str] = None
    years_experience: Optional[int] = None
    education: List[Dict[str, Any]] = field(default_factory=list)
    languages: List[Language] = field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["languages"] = [asdict(l) if isinstance(l, Language) else l for l in self.languages]
        return d


@dataclass
class JobNormalized:
    job_id: int = 0
    required_skills: List[str] = field(default_factory=list)
    preferred_skills: List[str] = field(default_factory=list)
    all_skills: List[str] = field(default_factory=list)
    role_keywords: List[str] = field(default_factory=list)
    seniority: Optional[str] = None
    analyzed_at: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MatchRelated:
    source: str = ""
    target: str = ""
    confidence: float = 0.0


@dataclass
class JobMatch:
    id: int = 0
    job_id: int = 0
    profile_id: int = 0
    profile_version: int = 1
    final_score: Optional[float] = None
    required_score: Optional[float] = None
    preferred_score: Optional[float] = None
    semantic_score: Optional[float] = None
    experience_score: Optional[float] = None
    role_score: Optional[float] = None
    exact_matches: List[str] = field(default_factory=list)
    related_matches: List[MatchRelated] = field(default_factory=list)
    gaps: List[str] = field(default_factory=list)
    explanation: Optional[str] = None
    analyzed_at: Optional[str] = None

    def to_dict(self) -> dict:
        d = asdict(self)
        d["related_matches"] = [asdict(r) if isinstance(r, MatchRelated) else r for r in self.related_matches]
        return d