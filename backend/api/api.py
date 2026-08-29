from __future__ import annotations

import asyncio
import hmac
import json
import logging
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy import and_, delete, func, select

from backend.config import load_config, get_database_config
from backend.database import Database, JobRecord
from backend.scraper.base_scraper import ScraperRegistry

from .api_models import (
    BulkPatchRequest,
    FacetsResponse,
    JobPatch,
    JobResponse,
    JobsListResponse,
    ScrapeRequest,
    ScrapeResponse,
    SourceCount,
    StatsResponse,
    StatusCount,
    SummaryResponse,
)
from .api_filters import (
    VALID_SORTS,
    VALID_STATUSES,
    _build_filters,
    _iso,
    _order_clause,
    _to_response,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCRAPER_CMD_BASE = ["python", "-m", "backend.main"]
SCRAPER_CWD = "/app"

_db_instance = None


def get_db() -> Database:
    global _db_instance
    if _db_instance is None:
        config = load_config()
        db_config = get_database_config(config)
        _db_instance = Database(db_config)
        _db_instance.ensure_user_columns()
    return _db_instance


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
    version="1.2.0",
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


class APIKeyMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, api_key: Optional[str] = None):
        super().__init__(app)
        self.api_key = api_key or os.environ.get("API_KEY", "")

    async def dispatch(self, request: Request, call_next):
        if not self.api_key:
            return await call_next(request)

        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        key = request.headers.get("X-API-Key") or request.query_params.get("api_key")
        if not key or not hmac.compare_digest(key, self.api_key):
            return Response(status_code=401, content="Invalid or missing API key")
        return await call_next(request)


app.add_middleware(APIKeyMiddleware, api_key=os.environ.get("API_KEY"))


@app.get("/health")
async def health():
    try:
        db = get_db()
        with db.session() as session:
            session.scalar(select(1))
        return {"status": "ok", "database": "ok"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail={"status": "error", "database": f"unavailable: {exc}"})


def _run_cmd(cmd: List[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, cwd=SCRAPER_CWD, timeout=300)


def _parse_scrape_output(stdout: str) -> dict:
    """Parse JSON from scraper output (handles pretty-printed multi-line JSON)."""
    for line in reversed(stdout.strip().splitlines()):
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue
    return {}


def _run_background_scrape(source: str, term: Optional[str], pages: int, page_size: int):
    cmd = SCRAPER_CMD_BASE + ["scrape", source, "--pages", str(pages), "--page-size", str(page_size)]
    if term:
        cmd += ["--term", term]
    try:
        result = _run_cmd(cmd)
        if result.returncode != 0:
            logger.error("Scrape failed: %s", result.stderr[-500:] if result.stderr else "unknown error")
        else:
            data = _parse_scrape_output(result.stdout)
            logger.info(
                "Scrape complete: source=%s new=%s updated=%s",
                source, data.get("new_jobs", 0), data.get("updated_jobs", 0),
            )
    except Exception as exc:
        logger.error("Scrape exception: %s", exc)


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape(req: ScrapeRequest, background: BackgroundTasks):
    background.add_task(_run_background_scrape, req.source, req.term, req.pages, req.page_size)
    return ScrapeResponse(status="started", source=req.source, term=req.term, pages=req.pages)


@app.post("/scrape/sync", response_model=ScrapeResponse)
async def scrape_sync(req: ScrapeRequest):
    cmd = SCRAPER_CMD_BASE + ["scrape", req.source, "--pages", str(req.pages), "--page-size", str(req.page_size)]
    if req.term:
        cmd += ["--term", req.term]

    result = await asyncio.to_thread(_run_cmd, cmd)
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
        stmt = select(func.count(JobRecord.id))
        if source:
            stmt = stmt.where(JobRecord.source == source)
        count = session.scalar(stmt) or 0
        return StatsResponse(source=source, count=count)


@app.get("/sources")
async def list_sources():
    return {"sources": ScraperRegistry.list_available()}


@app.get("/jobs", response_model=JobsListResponse)
async def list_jobs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
    source_only: Optional[str] = None,
    source: Optional[str] = None,
    remote: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    job_type: Optional[str] = None,
    experience: Optional[str] = None,
    company: Optional[str] = None,
    skill: Optional[str] = None,
    user_status: Optional[str] = Query(None, description="Filter by workflow status"),
    saved: Optional[bool] = Query(None),
    posted_within: Optional[int] = Query(None, ge=0, le=365, description="Days back (publication date)"),
    discovered_within: Optional[int] = Query(None, ge=0, le=365, description="Days back (first discovered)"),
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
        discovered_within=discovered_within or None,
        has_salary=has_salary,
    )
    filters = _build_filters(args)
    order = _order_clause(sort, q)

    with db.session() as session:
        count_stmt = select(func.count(JobRecord.id))
        for f in filters:
            count_stmt = count_stmt.where(f)
        total = session.scalar(count_stmt) or 0

        total_pages = max(1, -(-total // limit))
        page = min(page, total_pages)
        offset = (page - 1) * limit

        stmt = select(JobRecord)
        for f in filters:
            stmt = stmt.where(f)
        for o in order:
            stmt = stmt.order_by(o)
        stmt = stmt.limit(limit).offset(offset)

        records = session.scalars(stmt).all()
        jobs = [_to_response(r) for r in records]

        return JobsListResponse(
            jobs=jobs,
            total=total,
            page=page,
            page_size=limit,
            total_pages=total_pages,
        )


@app.get("/jobs/purgeable")
async def count_purgeable_jobs(
    days: int = Query(45, ge=0),
    source: Optional[str] = Query(None),
):
    db = get_db()
    with db.session() as session:
        stmt = select(func.count(JobRecord.id)).where(
            JobRecord.published_at < func.now() - func.make_interval(0, 0, 0, days),
            JobRecord.user_status.in_(["new", "reviewing"]),
        )
        if source:
            stmt = stmt.where(JobRecord.source == source)
        count = session.scalar(stmt) or 0
        return {"count": count, "older_than_days": days, "source": source}


@app.get("/jobs/facets", response_model=FacetsResponse)
async def job_facets():
    db = get_db()
    with db.session() as session:
        sources = [
            SourceCount(source=name or "unknown", count=count)
            for name, count in session.execute(
                select(JobRecord.source, func.count(JobRecord.id)).group_by(JobRecord.source)
            ).all()
        ]
        locations = [
            loc for (loc,) in session.execute(
                select(JobRecord.city).where(JobRecord.city.isnot(None)).distinct().order_by(JobRecord.city).limit(100)
            ).all()
        ]
        employment_types = [
            t for (t,) in session.execute(
                select(JobRecord.job_type).where(JobRecord.job_type.isnot(None)).distinct().order_by(JobRecord.job_type)
            ).all()
        ]
        experience_levels = [
            e for (e,) in session.execute(
                select(JobRecord.experience_level).where(JobRecord.experience_level.isnot(None)).distinct().order_by(JobRecord.experience_level)
            ).all()
        ]
        return FacetsResponse(
            sources=sources,
            locations=locations,
            employment_types=employment_types,
            experience_levels=experience_levels,
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
        record = _get_record_or_404(session, job_id)
        return _to_response(record)


@app.patch("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: int, patch: JobPatch):
    db = get_db()
    with db.session() as session:
        record = _get_record_or_404(session, job_id)
        _apply_patch(record, patch)
        session.commit()
        return _to_response(record)


def _apply_patch(record: JobRecord, patch: JobPatch):
    if patch.user_status is not None:
        if patch.user_status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
        record.user_status = patch.user_status
    if patch.is_saved is not None:
        record.is_saved = patch.is_saved
    if patch.notes is not None:
        record.notes = patch.notes
    if patch.mark_reviewed:
        record.reviewed_at = datetime.now(timezone.utc)


@app.post("/jobs/bulk")
async def bulk_update(req: BulkPatchRequest):
    db = get_db()
    updated = 0
    with db.session() as session:
        ids = req.ids[:1000]
        records = session.scalars(
            select(JobRecord).where(JobRecord.id.in_(ids))
        ).all()
        id_set = set(ids)
        for record in records:
            _apply_patch(record, req)
            updated += 1
        missing = len(id_set) - len(records)
    return {"updated": updated, "missing": missing}


@app.get("/stats/summary", response_model=SummaryResponse)
async def stats_summary():
    db = get_db()
    with db.session() as session:
        total = session.scalar(select(func.count(JobRecord.id))) or 0
        saved = session.scalar(select(func.count(JobRecord.id)).where(JobRecord.is_saved.is_(True))) or 0
        unread = session.scalar(
            select(func.count(JobRecord.id)).where(
                JobRecord.user_status == "new",
                JobRecord.created_at >= func.now() - func.make_interval(0, 0, 0, 2),
            )
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


@app.delete("/jobs/cleanup")
async def cleanup_old_jobs(
    days: int = Query(45, ge=0, description="Remove jobs older than N days"),
    source: Optional[str] = Query(None, description="Limit to a specific source"),
):
    db = get_db()
    with db.session() as session:
        stmt = delete(JobRecord).where(
            JobRecord.published_at < func.now() - func.make_interval(0, 0, 0, days),
            JobRecord.user_status.in_(["new", "reviewing"]),
        )
        if source:
            stmt = stmt.where(JobRecord.source == source)
        result = session.execute(stmt)
        return {"deleted": result.rowcount, "older_than_days": days, "source": source}
