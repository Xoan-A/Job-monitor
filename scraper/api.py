from __future__ import annotations

import logging
import os
import subprocess
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import BigInteger, and_, cast, func, or_, select, String

from scraper.config import load_config, get_database_config
from scraper.database import Database, JobRecord

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCRAPER_CMD_BASE = ["python", "-m", "scraper.main"]
SCRAPER_CWD = "/app"

VALID_STATUSES = ["new", "reviewing", "shortlisted", "applied", "interview", "rejected", "archived"]
VALID_SORTS = ["newest", "oldest", "company", "relevance", "salary"]

_db_instance = None


def get_db() -> Database:
    global _db_instance
    if _db_instance is None:
        config = load_config()
        db_config = get_database_config(config)
        _db_instance = Database(db_config)
        _db_instance.ensure_user_columns()
    return _db_instance


_profile_cache: Optional[Dict[str, Any]] = None


def get_profile() -> Dict[str, Any]:
    """Optional candidate profile (config.yaml `profile.skills`) used for keyword matching."""
    global _profile_cache
    if _profile_cache is None:
        try:
            config = load_config()
            _profile_cache = config.get("profile", {}) or {}
        except Exception:
            _profile_cache = {}
    return _profile_cache


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class ScrapeRequest(BaseModel):
    source: str = Field(default="buscojobs", description="Scraper source (buscojobs, jooble)")
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _iso(dt) -> Optional[str]:
    return dt.isoformat() if dt else None


def _compose_location(r: JobRecord) -> Optional[str]:
    parts = [p for p in [r.city, r.department, r.country] if p]
    seen: List[str] = []
    for p in parts:
        if p not in seen:
            seen.append(p)
    return ", ".join(seen) if seen else None


def _compute_match(record: JobRecord) -> tuple[Optional[int], List[str], List[str]]:
    keywords = get_profile().get("skills") or []
    keywords = [str(k).strip() for k in keywords if str(k).strip()]
    if not keywords:
        return None, [], []
    haystacks = " ".join(
        [
            (record.title or "").lower(),
            " ".join(record.tags or []).lower(),
            (record.description or "")[:4000].lower(),
        ]
    )
    matched: List[str] = []
    missing: List[str] = []
    for kw in keywords:
        if kw.lower() in haystacks:
            matched.append(kw)
        else:
            missing.append(kw)
    total = len(matched) + len(missing)
    score = round(100 * len(matched) / total) if total else None
    return score, matched, missing


def _to_response(r: JobRecord) -> JobResponse:
    score, strong, gaps = _compute_match(r)
    tags = r.tags if isinstance(r.tags, list) else []
    return JobResponse(
        id=r.id,
        title=r.title,
        url=r.url,
        application_url=r.url,
        company=r.company,
        description=r.description,
        city=r.city,
        department=r.department,
        country=r.country,
        location=_compose_location(r),
        published_at=_iso(r.published_at),
        scraped_at=_iso(r.scraped_at) if hasattr(r, "scraped_at") else None,
        modality=r.modality,
        channel=r.channel,
        subchannel=r.subchannel,
        is_confidential=bool(r.is_confidential),
        is_featured=bool(r.is_featured),
        company_id=r.company_id,
        source=r.source,
        salary=r.salary,
        job_type=r.job_type,
        tags=[str(t) for t in tags],
        experience_level=r.experience_level,
        external_id=str(r.external_id) if r.external_id else None,
        user_status=r.user_status or "new",
        is_saved=bool(r.is_saved),
        notes=r.notes,
        reviewed_at=_iso(r.reviewed_at),
        created_at=_iso(r.created_at),
        updated_at=_iso(r.updated_at),
        match_score=score,
        match_strong=strong,
        match_gaps=gaps,
    )


def _build_filters(args: Dict[str, Any]) -> List:
    filters = []
    if args.get("source_only"):
        filters.append(JobRecord.source == args["source_only"])
    elif args.get("source"):
        filters.append(JobRecord.source == args["source"])
    q = args.get("q")
    if q:
        term = f"%{q}%"
        filters.append(or_(
            JobRecord.title.ilike(term),
            JobRecord.description.ilike(term),
            JobRecord.company.ilike(term),
            cast(JobRecord.tags, String).ilike(term),
        ))
    remote = args.get("remote")
    if remote:
        patterns = {
            "remote": ["%teletrabajo%", "%remoto%", "%remote%"],
            "hybrid": ["%híbrido%", "%hibrido%", "%hybrid%"],
            "onsite": ["%presencial%", "%on-site%", "%onsite%"],
        }.get(remote, [])
        if patterns:
            filters.append(or_(*[JobRecord.modality.ilike(p) for p in patterns]))
    if args.get("city"):
        filters.append(JobRecord.city.ilike(f"%{args['city']}%"))
    if args.get("job_type"):
        filters.append(JobRecord.job_type.ilike(f"%{args['job_type']}%"))
    if args.get("experience"):
        filters.append(JobRecord.experience_level.ilike(f"%{args['experience']}%"))
    if args.get("company"):
        filters.append(JobRecord.company.ilike(f"%{args['company']}%"))
    status = args.get("user_status")
    if status and status in VALID_STATUSES:
        filters.append(JobRecord.user_status == status)
    if args.get("saved") is not None:
        filters.append(JobRecord.is_saved.is_(bool(args["saved"])))
    posted_within = args.get("posted_within")
    if posted_within:
        filters.append(
            func.coalesce(JobRecord.published_at, JobRecord.created_at)
            >= func.now() - func.make_interval(0, 0, 0, posted_within)
        )
    skill = args.get("skill")
    if skill:
        filters.append(cast(JobRecord.tags, String).ilike(f"%{skill}%"))
    has_salary = args.get("has_salary")
    if has_salary:
        filters.append(and_(JobRecord.salary.isnot(None), JobRecord.salary != ""))
    return filters


def _order_clause(sort: str, q: Optional[str]):
    newest = func.coalesce(JobRecord.published_at, JobRecord.created_at)
    salary_num = cast(
        func.nullif(func.regexp_replace(func.split_part(JobRecord.salary, "-", 1), "[^0-9]", "", "g"), ""),
        BigInteger,
    )
    if sort == "oldest":
        return [newest.asc().nulls_last()]
    if sort == "company":
        return [JobRecord.company.asc().nulls_last(), newest.desc()]
    if sort == "salary":
        return [salary_num.desc().nullslast(), newest.desc()]
    if sort == "relevance" and q:
        exact = JobRecord.title.ilike(f"%{q}%").desc()
        return [exact, newest.desc()]
    return [newest.desc()]


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Scraper API starting up")
    try:
        get_db()
    except Exception as exc:
        logger.warning("Database not reachable at startup: %s", exc)
    yield
    logger.info("Scraper API shutting down")


app = FastAPI(
    title="Job Monitor Scraper API",
    version="1.1.0",
    lifespan=lifespan,
)

_extra_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_extra_origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|169\.254\.83\.107|\[::1\])(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    try:
        db = get_db()
        with db.session() as session:
            session.scalar(select(1))
        return {"status": "ok", "database": "ok"}
    except Exception as exc:
        return {"status": "ok", "database": f"unavailable: {exc}"}


# ---------------------------------------------------------------------------
# Scraping
# ---------------------------------------------------------------------------


def _run_cmd(cmd: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, cwd=SCRAPER_CWD, timeout=300)


def _parse_scrape_output(stdout: str) -> dict:
    """Parse JSON from scraper output (handles pretty-printed multi-line JSON)."""
    import json

    try:
        return json.loads(stdout.strip())
    except json.JSONDecodeError:
        pass
    for line in reversed(stdout.strip().split("\n")):
        line = line.strip()
        if line.startswith("{") or line.startswith("["):
            try:
                import json as _json

                return _json.loads(line)
            except json.JSONDecodeError:
                continue
    return {}


async def _run_background_scrape(cmd: List[str], source: str):
    try:
        result = _run_cmd(cmd)
        if result.returncode != 0:
            logger.error("Scrape failed for %s: %s", source, result.stderr)
        else:
            logger.info("Scrape completed for %s: %s", source, result.stdout[-200:])
    except Exception as e:
        logger.exception("Background scrape error for %s: %s", source, e)


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(req: ScrapeRequest, background_tasks: BackgroundTasks):
    """Start a scrape job in background, return immediately."""
    cmd = SCRAPER_CMD_BASE + ["scrape", req.source, "--pages", str(req.pages), "--page-size", str(req.page_size)]
    if req.term:
        cmd += ["--term", req.term]
    background_tasks.add_task(_run_background_scrape, cmd, req.source)
    return ScrapeResponse(status="started", source=req.source, term=req.term, pages=req.pages)


@app.post("/scrape/sync", response_model=ScrapeResponse)
async def scrape_sync(req: ScrapeRequest):
    """Run scrape synchronously and return results."""
    cmd = SCRAPER_CMD_BASE + ["scrape", req.source, "--pages", str(req.pages), "--page-size", str(req.page_size)]
    if req.term:
        cmd += ["--term", req.term]

    result = _run_cmd(cmd)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=result.stderr[-500:] or "Scrape failed")

    data = _parse_scrape_output(result.stdout)
    return ScrapeResponse(
        status="done",
        source=req.source,
        term=req.term,
        pages=req.pages,
        jobs_found=data.get("total"),
        jobs_new=data.get("new_jobs"),
        jobs_updated=data.get("updated_jobs"),
        total_on_site=data.get("total"),
    )


@app.get("/stats", response_model=StatsResponse)
async def stats(source: Optional[str] = None):
    db = get_db()
    with db.session() as session:
        query = select(func.count(JobRecord.id))
        if source:
            query = query.where(JobRecord.source == source)
        count = session.scalar(query) or 0
    return StatsResponse(source=source, count=count)


@app.get("/sources")
async def list_sources():
    result = _run_cmd(SCRAPER_CMD_BASE + ["list"])
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail=result.stderr[-300:])
    sources = [s.strip() for s in result.stdout.strip().split("\n") if s.strip()]
    return {"sources": sources}


# ---------------------------------------------------------------------------
# Jobs: list / detail / mutations
# ---------------------------------------------------------------------------


@app.get("/jobs", response_model=JobsListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    source: Optional[str] = Query(None),
    source_only: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Search in title, description, company, tags"),
    remote: Optional[str] = Query(None, description="remote | hybrid | onsite"),
    city: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    experience: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    user_status: Optional[str] = Query(None, description="Filter by workflow status"),
    saved: Optional[bool] = Query(None),
    posted_within: Optional[int] = Query(None, ge=0, le=365, description="Days back"),
    has_salary: Optional[bool] = Query(None),
    sort: str = Query("newest", description="newest | oldest | company | relevance | salary"),
):
    db = get_db()
    args = dict(
        source=source,
        source_only=source_only,
        q=q,
        remote=remote,
        city=city,
        country=country,
        job_type=job_type,
        experience=experience,
        company=company,
        skill=skill,
        user_status=user_status if user_status in VALID_STATUSES else None,
        saved=saved,
        posted_within=posted_within or None,
        has_salary=has_salary,
    )
    with db.session() as session:
        filters = _build_filters(args)
        total = session.scalar(select(func.count(JobRecord.id)).where(*filters)) or 0

        offset = (page - 1) * limit
        query = select(JobRecord).where(*filters)
        for clause in _order_clause(sort if sort in VALID_SORTS else "newest", q):
            query = query.order_by(clause)
        records = session.scalars(query.offset(offset).limit(limit)).all()
        return JobsListResponse(
            jobs=[_to_response(r) for r in records],
            total=total,
            page=page,
            page_size=len(records),
            total_pages=(total + limit - 1) // limit if limit else 0,
        )


@app.get("/jobs/facets", response_model=FacetsResponse)
async def job_facets():
    """Distinct filter option values with counts (must be declared before /jobs/{id})."""
    db = get_db()
    with db.session() as session:
        sources = [
            SourceCount(source=name or "unknown", count=count)
            for name, count in session.execute(
                select(JobRecord.source, func.count(JobRecord.id)).group_by(JobRecord.source)
            ).all()
        ]
        locations = [
            row for row in session.scalars(
                select(JobRecord.city).where(JobRecord.city.isnot(None), JobRecord.city != "")
                .group_by(JobRecord.city).order_by(func.count().desc()).limit(60)
            ).all()
        ]
        employment_types = [
            v for v in session.scalars(
                select(JobRecord.job_type).where(JobRecord.job_type.isnot(None), JobRecord.job_type != "")
                .group_by(JobRecord.job_type).order_by(func.count().desc()).limit(30)
            ).all()
        ]
        experience_levels = [
            v for v in session.scalars(
                select(JobRecord.experience_level)
                .where(JobRecord.experience_level.isnot(None), JobRecord.experience_level != "")
                .group_by(JobRecord.experience_level).order_by(func.count().desc()).limit(20)
            ).all()
        ]
        return FacetsResponse(
            sources=sources,
            locations=[str(v) for v in locations],
            employment_types=[str(v) for v in employment_types],
            experience_levels=[str(v) for v in experience_levels],
        )


def _get_record_or_404(session, job_id: int) -> JobRecord:
    record = session.get(JobRecord, job_id)
    if not record:
        raise HTTPException(status_code=404, detail="Job not found")
    return record


@app.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: int):
    db = get_db()
    with db.session() as session:
        return _to_response(_get_record_or_404(session, job_id))


def _apply_patch(record: JobRecord, patch: JobPatch) -> None:
    from datetime import datetime as _dt

    if patch.user_status is not None:
        if patch.user_status not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"Invalid status '{patch.user_status}'")
        record.user_status = patch.user_status
    if patch.is_saved is not None:
        record.is_saved = patch.is_saved
    if patch.notes is not None:
        record.notes = patch.notes
    if patch.mark_reviewed:
        record.reviewed_at = _dt.utcnow()


@app.patch("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: int, patch: JobPatch):
    db = get_db()
    with db.session() as session:
        record = _get_record_or_404(session, job_id)
        _apply_patch(record, patch)
        session.flush()
        return _to_response(record)


@app.post("/jobs/bulk", response_model=dict)
async def bulk_update(req: BulkPatchRequest):
    db = get_db()
    if req.user_status is None and req.is_saved is None and not req.mark_reviewed:
        raise HTTPException(status_code=422, detail="Nothing to update")
    if req.user_status is not None and req.user_status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status '{req.user_status}'")

    patch = JobPatch(
        user_status=req.user_status,
        is_saved=req.is_saved,
        mark_reviewed=req.mark_reviewed,
    )
    updated = 0
    missing = 0
    with db.session() as session:
        for job_id in req.ids[:1000]:
            try:
                record = _get_record_or_404(session, job_id)
            except HTTPException:
                missing += 1
                continue
            _apply_patch(record, patch)
            updated += 1
    return {"updated": updated, "missing": missing}


# ---------------------------------------------------------------------------
# Stats summary
# ---------------------------------------------------------------------------


@app.get("/stats/summary", response_model=SummaryResponse)
async def stats_summary():
    db = get_db()
    with db.session() as session:
        total = session.scalar(select(func.count(JobRecord.id))) or 0
        saved = session.scalar(select(func.count(JobRecord.id)).where(JobRecord.is_saved.is_(True))) or 0
        unread = session.scalar(
            select(func.count(JobRecord.id)).where(JobRecord.user_status == "new")
        ) or 0
        by_status = [
            StatusCount(status=status or "new", count=count)
            for status, count in session.execute(
                select(JobRecord.user_status, func.count(JobRecord.id)).group_by(JobRecord.user_status)
            ).all()
        ]
        by_source = [
            SourceCount(source=name or "unknown", count=count)
            for name, count in session.execute(
                select(JobRecord.source, func.count(JobRecord.id)).group_by(JobRecord.source)
            ).all()
        ]
        return SummaryResponse(total=total, saved=saved, unread=unread, by_status=by_status, by_source=by_source)
