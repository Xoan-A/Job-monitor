from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Optional


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

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ScrapeResult:
    jobs: list[Job] = field(default_factory=list)
    total: int = 0
    pages: int = 0
    source: str = "api"

    def to_dict(self) -> dict:
        return {
            "source": self.source,
            "total": self.total,
            "pages": self.pages,
            "jobs": [job.to_dict() for job in self.jobs],
        }