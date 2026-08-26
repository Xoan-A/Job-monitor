from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import BigInteger, and_, cast, func, or_, select, String

from scraper.config import load_config
from scraper.database import JobRecord

from .api_models import JobResponse

VALID_STATUSES = ["new", "reviewing", "shortlisted", "applied", "interview", "rejected", "archived"]
VALID_SORTS = ["newest", "oldest", "company", "relevance", "salary"]

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
        scraped_at=None,
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
    discovered_within = args.get("discovered_within")
    if discovered_within:
        filters.append(
            JobRecord.created_at >= func.now() - func.make_interval(0, 0, 0, discovered_within)
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
