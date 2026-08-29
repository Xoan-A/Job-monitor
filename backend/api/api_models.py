from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ScrapeRequest(BaseModel):
    source: str = Field(default="buscojobs", description="Scraper source (buscojobs, jooble, getonbrd)")
    term: Optional[str] = Field(default=None, description="Search term")
    pages: int = Field(default=3, ge=1, le=50, description="Number of pages")
    page_size: int = Field(default=15, ge=1, le=100, description="Results per page")


class ScrapeResponse(BaseModel):
    status: str
    source: str
    term: Optional[str] = None
    pages: int
    jobs_found: Optional[int] = None
    jobs_new: Optional[int] = None
    jobs_updated: Optional[int] = None
    total_on_site: Optional[int] = None
    error: Optional[str] = None


class StatsResponse(BaseModel):
    source: Optional[str] = None
    count: int


class StatusCount(BaseModel):
    status: str
    count: int


class SourceCount(BaseModel):
    source: str
    count: int


class SummaryResponse(BaseModel):
    total: int
    saved: int
    unread: int
    by_status: List[StatusCount]
    by_source: List[SourceCount]


class FacetsResponse(BaseModel):
    sources: List[SourceCount]
    locations: List[str]
    employment_types: List[str]
    experience_levels: List[str]


class JobResponse(BaseModel):
    id: int
    title: str
    url: Optional[str] = None
    application_url: Optional[str] = None
    company: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    country: Optional[str] = None
    location: Optional[str] = None
    published_at: Optional[str] = None
    scraped_at: Optional[str] = None
    modality: Optional[str] = None
    channel: Optional[str] = None
    subchannel: Optional[str] = None
    is_confidential: bool = False
    is_featured: bool = False
    company_id: Optional[int] = None
    source: str = "buscojobs"
    salary: Optional[str] = None
    job_type: Optional[str] = None
    tags: List[str] = []
    experience_level: Optional[str] = None
    external_id: Optional[str] = None
    user_status: str = "new"
    is_saved: bool = False
    notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    match_score: Optional[int] = None
    match_strong: List[str] = []
    match_gaps: List[str] = []
    match_related: List[dict] = []
    match_explanation: Optional[str] = None
    match_required_score: Optional[int] = None
    match_preferred_score: Optional[int] = None
    match_semantic_score: Optional[int] = None
    match_experience_score: Optional[int] = None
    match_role_score: Optional[int] = None


class JobsListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class JobPatch(BaseModel):
    user_status: Optional[str] = None
    is_saved: Optional[bool] = None
    notes: Optional[str] = None
    mark_reviewed: Optional[bool] = None


class BulkPatchRequest(BaseModel):
    ids: List[int] = Field(..., min_length=1)
    user_status: Optional[str] = None
    is_saved: Optional[bool] = None
    mark_reviewed: Optional[bool] = None
