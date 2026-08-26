from __future__ import annotations

import os
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, Generator, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    func,
    select,
    text,
)
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .models import Job, ScrapeResult


class Base(DeclarativeBase):
    pass


class JobRecord(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_source_external_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, index=True)
    external_id = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    url = Column(String(1000))
    company = Column(String(300))
    description = Column(Text)
    city = Column(String(200))
    department = Column(String(200))
    country = Column(String(100))
    published_at = Column(DateTime, index=True)
    modality = Column(String(100))
    channel = Column(String(100))
    subchannel = Column(String(100))
    is_confidential = Column(Integer, default=0)
    is_featured = Column(Integer, default=0)
    company_id = Column(Integer)
    salary = Column(String(200))
    job_type = Column(String(100))
    tags = Column(JSON)
    experience_level = Column(String(100))
    raw_data = Column(JSON)
    # User workflow state (added by the frontend/API layer)
    user_status = Column(String(20), nullable=False, server_default="new", index=True)
    is_saved = Column(Boolean, nullable=False, server_default=text("false"))
    notes = Column(Text)
    reviewed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def to_job(self) -> Job:
        import json
        tags = self.tags
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except Exception:
                tags = []
        return Job(
            id=int(self.external_id) if self.external_id else self.id,
            title=self.title,
            url=self.url,
            company=self.company,
            description=self.description,
            city=self.city,
            department=self.department,
            country=self.country,
            published_at=self.published_at.isoformat() if self.published_at else None,
            modality=self.modality,
            channel=self.channel,
            subchannel=self.subchannel,
            is_confidential=bool(self.is_confidential),
            is_featured=bool(self.is_featured),
            company_id=self.company_id,
            source=self.source,
            salary=self.salary,
            job_type=self.job_type,
            tags=tags or [],
            experience_level=self.experience_level,
        )

    @classmethod
    def from_job(cls, job: Job) -> "JobRecord":
        return cls(
            source=job.source,
            external_id=str(job.id),
            title=job.title,
            url=job.url,
            company=job.company,
            description=job.description,
            city=job.city,
            department=job.department,
            country=job.country,
            published_at=datetime.fromisoformat(job.published_at.replace("Z", "+00:00")) if job.published_at else func.now(),
            modality=job.modality,
            channel=job.channel,
            subchannel=job.subchannel,
            is_confidential=int(job.is_confidential),
            is_featured=int(job.is_featured),
            company_id=job.company_id,
            salary=job.salary,
            job_type=job.job_type,
            tags=job.tags,
            experience_level=job.experience_level,
            raw_data=job.to_dict(),
        )


class ScrapeRunRecord(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, index=True)
    term = Column(String(200))
    pages_scraped = Column(Integer, default=0)
    jobs_found = Column(Integer, default=0)
    jobs_new = Column(Integer, default=0)
    jobs_updated = Column(Integer, default=0)
    started_at = Column(DateTime, default=func.now(), nullable=False)
    completed_at = Column(DateTime)
    status = Column(String(20), default="running")
    error = Column(Text)


class Database:
    def __init__(self, config: Dict[str, Any]):
        host = config.get("host", os.environ.get("POSTGRES_HOST", "localhost"))
        port = config.get("port", int(os.environ.get("POSTGRES_PORT", "5432")))
        user = config.get("user", os.environ.get("POSTGRES_USER", "jobmonitor"))
        password = config.get("password", os.environ.get("POSTGRES_PASSWORD", "change_me"))
        name = config.get("name", os.environ.get("POSTGRES_DB", "jobmonitor"))
        pool_size = config.get("pool_size", 5)
        max_overflow = config.get("max_overflow", 10)

        url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
        self.engine = create_engine(
            url,
            pool_size=pool_size,
            max_overflow=max_overflow,
            pool_pre_ping=True,
        )
        self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)

    def init_db(self):
        Base.metadata.create_all(self.engine)
        self.ensure_user_columns()

    def ensure_user_columns(self):
        """Lightweight migration: add user workflow columns if the table predates them."""
        statements = [
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_status VARCHAR(20) NOT NULL DEFAULT 'new'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP",
            "CREATE INDEX IF NOT EXISTS ix_jobs_user_status ON jobs (user_status)",
        ]
        with self.engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))

    @contextmanager
    def session(self) -> Generator[Session, None, None]:
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def upsert_jobs(self, jobs: List[Job]) -> Dict[str, int]:
        if not jobs:
            return {"new": 0, "updated": 0}

        new_count = 0
        updated_count = 0

        with self.session() as session:
            url_map: Dict[str, int] = {}
            for job in jobs:
                if job.url:
                    existing_id = session.scalar(
                        select(JobRecord.id).where(
                            JobRecord.source == job.source,
                            JobRecord.url == job.url,
                        )
                    )
                    if existing_id:
                        url_map[job.url] = existing_id

            records = []
            for job in jobs:
                record = {
                    "source": job.source,
                    "external_id": str(job.id),
                    "title": job.title,
                    "url": job.url,
                    "company": job.company,
                    "description": job.description,
                    "city": job.city,
                    "department": job.department,
                    "country": job.country,
                    "published_at": datetime.fromisoformat(job.published_at.replace("Z", "+00:00")) if job.published_at else func.now(),
                    "modality": job.modality,
                    "channel": job.channel,
                    "subchannel": job.subchannel,
                    "is_confidential": int(job.is_confidential),
                    "is_featured": int(job.is_featured),
                    "company_id": job.company_id,
                    "salary": job.salary,
                    "job_type": job.job_type,
                    "tags": job.tags,
                    "experience_level": job.experience_level,
                    "raw_data": job.to_dict(),
                    "user_status": "new",
                }
                records.append(record)

            stmt = insert(JobRecord).values(records)
            stmt = stmt.on_conflict_do_update(
                index_elements=["source", "external_id"],
                set_={
                    "title": stmt.excluded.title,
                    "url": stmt.excluded.url,
                    "company": stmt.excluded.company,
                    "description": stmt.excluded.description,
                    "city": stmt.excluded.city,
                    "department": stmt.excluded.department,
                    "country": stmt.excluded.country,
                    "published_at": stmt.excluded.published_at,
                    "modality": stmt.excluded.modality,
                    "channel": stmt.excluded.channel,
                    "subchannel": stmt.excluded.subchannel,
                    "is_confidential": stmt.excluded.is_confidential,
                    "is_featured": stmt.excluded.is_featured,
                    "company_id": stmt.excluded.company_id,
                    "salary": stmt.excluded.salary,
                    "job_type": stmt.excluded.job_type,
                    "tags": stmt.excluded.tags,
                    "experience_level": stmt.excluded.experience_level,
                    "raw_data": stmt.excluded.raw_data,
                    "updated_at": func.now(),
                },
            )
            result = session.execute(stmt)
            session.commit()

            total_affected = result.rowcount
            new_count = max(0, total_affected - len(jobs))
            updated_count = total_affected - new_count

        return {"new": new_count, "updated": updated_count}

    def get_jobs(
        self,
        source: Optional[str] = None,
        term: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Job]:
        with self.session() as session:
            stmt = select(JobRecord).order_by(JobRecord.created_at.desc()).limit(limit).offset(offset)
            if source:
                stmt = stmt.where(JobRecord.source == source)
            if term:
                stmt = stmt.where(JobRecord.title.ilike(f"%{term}%"))
            records = session.scalars(stmt).all()
            return [r.to_job() for r in records]

    def get_job_count(self, source: Optional[str] = None) -> int:
        with self.session() as session:
            stmt = select(func.count(JobRecord.id))
            if source:
                stmt = stmt.where(JobRecord.source == source)
            return session.scalar(stmt) or 0

    def create_scrape_run(
        self, source: str, term: Optional[str] = None, pages: int = 0
    ) -> ScrapeRunRecord:
        with self.session() as session:
            run = ScrapeRunRecord(source=source, term=term, pages_scraped=pages)
            session.add(run)
            session.flush()
            return run

    def complete_scrape_run(
        self, run_id: int, jobs_found: int, new: int, updated: int, error: Optional[str] = None
    ):
        with self.session() as session:
            run = session.get(ScrapeRunRecord, run_id)
            if run:
                run.jobs_found = jobs_found
                run.jobs_new = new
                run.jobs_updated = updated
                run.completed_at = func.now()
                run.status = "error" if error else "completed"
                run.error = error