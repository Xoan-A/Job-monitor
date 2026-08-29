from __future__ import annotations

import os
from contextlib import contextmanager
from dataclasses import asdict
from datetime import datetime
from typing import Any, Dict, Generator, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    LargeBinary,
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

from .models import Job, ScrapeResult, CandidateProfile, Language, JobNormalized, JobMatch, MatchRelated


class Base(DeclarativeBase):
    pass


class JobRecord(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_source_external_id"),
        Index("ix_jobs_user_status_created", "user_status", "created_at"),
        Index("ix_jobs_source_published", "source", "published_at"),
        Index("ix_jobs_is_saved", "is_saved"),
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


class CandidateProfileRecord(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(Integer, default=1, nullable=False)
    raw_text = Column(Text)
    skills = Column(JSON, default=list)
    roles = Column(JSON, default=list)
    experience_level = Column(String(50))
    years_experience = Column(Integer)
    education = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    embedding = Column(LargeBinary)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def to_profile(self) -> CandidateProfile:
        return CandidateProfile(
            id=self.id,
            version=self.version,
            raw_text=self.raw_text or "",
            skills=self.skills or [],
            roles=self.roles or [],
            experience_level=self.experience_level,
            years_experience=self.years_experience,
            education=self.education or [],
            languages=[Language(**l) if isinstance(l, dict) else l for l in (self.languages or [])],
            created_at=self.created_at.isoformat() if self.created_at else None,
            updated_at=self.updated_at.isoformat() if self.updated_at else None,
        )


class JobNormalizedRecord(Base):
    __tablename__ = "job_normalized"
    __table_args__ = (
        Index("ix_job_normalized_job_id", "job_id"),
    )

    job_id = Column(Integer, primary_key=True)
    required_skills = Column(JSON, default=list)
    preferred_skills = Column(JSON, default=list)
    all_skills = Column(JSON, default=list)
    role_keywords = Column(JSON, default=list)
    seniority = Column(String(50))
    embedding = Column(LargeBinary)
    analyzed_at = Column(DateTime, default=func.now(), nullable=False)

    def to_normalized(self) -> JobNormalized:
        return JobNormalized(
            job_id=self.job_id,
            required_skills=self.required_skills or [],
            preferred_skills=self.preferred_skills or [],
            all_skills=self.all_skills or [],
            role_keywords=self.role_keywords or [],
            seniority=self.seniority,
            analyzed_at=self.analyzed_at.isoformat() if self.analyzed_at else None,
        )


class JobMatchRecord(Base):
    __tablename__ = "job_matches"
    __table_args__ = (
        UniqueConstraint("job_id", "profile_id", name="uq_job_profile"),
        Index("ix_job_matches_job_id", "job_id"),
        Index("ix_job_matches_profile_id", "profile_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(Integer, nullable=False)
    profile_id = Column(Integer, nullable=False)
    profile_version = Column(Integer, nullable=False, default=1)
    final_score = Column(Float)
    required_score = Column(Float)
    preferred_score = Column(Float)
    semantic_score = Column(Float)
    experience_score = Column(Float)
    role_score = Column(Float)
    exact_matches = Column(JSON, default=list)
    related_matches = Column(JSON, default=list)
    gaps = Column(JSON, default=list)
    explanation = Column(Text)
    analyzed_at = Column(DateTime, default=func.now(), nullable=False)

    def to_match(self) -> JobMatch:
        return JobMatch(
            id=self.id,
            job_id=self.job_id,
            profile_id=self.profile_id,
            profile_version=self.profile_version,
            final_score=self.final_score,
            required_score=self.required_score,
            preferred_score=self.preferred_score,
            semantic_score=self.semantic_score,
            experience_score=self.experience_score,
            role_score=self.role_score,
            exact_matches=self.exact_matches or [],
            related_matches=[MatchRelated(**r) if isinstance(r, dict) else r for r in (self.related_matches or [])],
            gaps=self.gaps or [],
            explanation=self.explanation,
            analyzed_at=self.analyzed_at.isoformat() if self.analyzed_at else None,
        )


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
        """Lightweight migration: add user workflow and matching tables/columns."""
        statements = [
            # User workflow columns
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_status VARCHAR(20) NOT NULL DEFAULT 'new'",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_saved BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT",
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP",
            "CREATE INDEX IF NOT EXISTS ix_jobs_user_status ON jobs (user_status)",
            # Candidate profiles table
            """CREATE TABLE IF NOT EXISTS candidate_profiles (
                id SERIAL PRIMARY KEY,
                version INTEGER NOT NULL DEFAULT 1,
                raw_text TEXT,
                skills JSONB DEFAULT '[]',
                roles JSONB DEFAULT '[]',
                experience_level VARCHAR(50),
                years_experience INTEGER,
                education JSONB DEFAULT '[]',
                languages JSONB DEFAULT '[]',
                embedding BYTEA,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )""",
            # Job normalized table
            """CREATE TABLE IF NOT EXISTS job_normalized (
                job_id INTEGER PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
                required_skills JSONB DEFAULT '[]',
                preferred_skills JSONB DEFAULT '[]',
                all_skills JSONB DEFAULT '[]',
                role_keywords JSONB DEFAULT '[]',
                seniority VARCHAR(50),
                embedding BYTEA,
                analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_job_normalized_job_id ON job_normalized (job_id)",
            # Job matches table
            """CREATE TABLE IF NOT EXISTS job_matches (
                id SERIAL PRIMARY KEY,
                job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                profile_id INTEGER NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
                profile_version INTEGER NOT NULL DEFAULT 1,
                final_score FLOAT,
                required_score FLOAT,
                preferred_score FLOAT,
                semantic_score FLOAT,
                experience_score FLOAT,
                role_score FLOAT,
                exact_matches JSONB DEFAULT '[]',
                related_matches JSONB DEFAULT '[]',
                gaps JSONB DEFAULT '[]',
                explanation TEXT,
                analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
                UNIQUE(job_id, profile_id)
            )""",
            "CREATE INDEX IF NOT EXISTS ix_job_matches_job_id ON job_matches (job_id)",
            "CREATE INDEX IF NOT EXISTS ix_job_matches_profile_id ON job_matches (profile_id)",
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

    def upsert_candidate_profile(self, profile: CandidateProfile, embedding: Optional[bytes] = None) -> int:
        with self.session() as session:
            existing = session.scalars(
                select(CandidateProfileRecord).order_by(CandidateProfileRecord.id.desc()).limit(1)
            ).first()
            if existing:
                existing.version += 1
                existing.raw_text = profile.raw_text
                existing.skills = profile.skills
                existing.roles = profile.roles
                existing.experience_level = profile.experience_level
                existing.years_experience = profile.years_experience
                existing.education = profile.education
                existing.languages = [asdict(l) if hasattr(l, '__dataclass_fields__') else l for l in profile.languages]
                if embedding is not None:
                    existing.embedding = embedding
                existing.updated_at = func.now()
                session.commit()
                return existing.id
            else:
                record = CandidateProfileRecord(
                    version=1,
                    raw_text=profile.raw_text,
                    skills=profile.skills,
                    roles=profile.roles,
                    experience_level=profile.experience_level,
                    years_experience=profile.years_experience,
                    education=profile.education,
                    languages=[asdict(l) if hasattr(l, '__dataclass_fields__') else l for l in profile.languages],
                    embedding=embedding,
                )
                session.add(record)
                session.flush()
                return record.id

    def get_latest_profile(self) -> Optional[CandidateProfile]:
        with self.session() as session:
            record = session.scalars(
                select(CandidateProfileRecord).order_by(CandidateProfileRecord.id.desc()).limit(1)
            ).first()
            if not record:
                return None
            return record.to_profile()

    def get_latest_profile_record(self) -> Optional[CandidateProfileRecord]:
        with self.session() as session:
            return session.scalars(
                select(CandidateProfileRecord).order_by(CandidateProfileRecord.id.desc()).limit(1)
            ).first()

    def get_profile_embedding(self, profile_id: int) -> Optional[bytes]:
        with self.session() as session:
            record = session.get(CandidateProfileRecord, profile_id)
            return record.embedding if record else None

    def upsert_job_normalized(self, normalized: JobNormalized, embedding: Optional[bytes] = None):
        with self.session() as session:
            existing = session.get(JobNormalizedRecord, normalized.job_id)
            if existing:
                existing.required_skills = normalized.required_skills
                existing.preferred_skills = normalized.preferred_skills
                existing.all_skills = normalized.all_skills
                existing.role_keywords = normalized.role_keywords
                existing.seniority = normalized.seniority
                if embedding is not None:
                    existing.embedding = embedding
                existing.analyzed_at = func.now()
            else:
                record = JobNormalizedRecord(
                    job_id=normalized.job_id,
                    required_skills=normalized.required_skills,
                    preferred_skills=normalized.preferred_skills,
                    all_skills=normalized.all_skills,
                    role_keywords=normalized.role_keywords,
                    seniority=normalized.seniority,
                    embedding=embedding,
                )
                session.add(record)

    def get_all_job_normalized(self) -> List[JobNormalized]:
        with self.session() as session:
            records = session.scalars(select(JobNormalizedRecord)).all()
            return [r.to_normalized() for r in records]

    def get_job_normalized(self, job_id: int) -> Optional[JobNormalized]:
        with self.session() as session:
            record = session.get(JobNormalizedRecord, job_id)
            return record.to_normalized() if record else None

    def get_job_embedding(self, job_id: int) -> Optional[bytes]:
        with self.session() as session:
            record = session.get(JobNormalizedRecord, job_id)
            return record.embedding if record else None

    def upsert_job_match(self, match: JobMatch):
        with self.session() as session:
            existing = session.scalars(
                select(JobMatchRecord).where(
                    JobMatchRecord.job_id == match.job_id,
                    JobMatchRecord.profile_id == match.profile_id,
                )
            ).first()
            if existing:
                existing.profile_version = match.profile_version
                existing.final_score = match.final_score
                existing.required_score = match.required_score
                existing.preferred_score = match.preferred_score
                existing.semantic_score = match.semantic_score
                existing.experience_score = match.experience_score
                existing.role_score = match.role_score
                existing.exact_matches = match.exact_matches
                existing.related_matches = [asdict(r) if hasattr(r, '__dataclass_fields__') else r for r in match.related_matches]
                existing.gaps = match.gaps
                existing.explanation = match.explanation
                existing.analyzed_at = func.now()
            else:
                record = JobMatchRecord(
                    job_id=match.job_id,
                    profile_id=match.profile_id,
                    profile_version=match.profile_version,
                    final_score=match.final_score,
                    required_score=match.required_score,
                    preferred_score=match.preferred_score,
                    semantic_score=match.semantic_score,
                    experience_score=match.experience_score,
                    role_score=match.role_score,
                    exact_matches=match.exact_matches,
                    related_matches=[asdict(r) if hasattr(r, '__dataclass_fields__') else r for r in match.related_matches],
                    gaps=match.gaps,
                    explanation=match.explanation,
                )
                session.add(record)

    def get_job_match(self, job_id: int, profile_id: int) -> Optional[JobMatch]:
        with self.session() as session:
            record = session.scalars(
                select(JobMatchRecord).where(
                    JobMatchRecord.job_id == job_id,
                    JobMatchRecord.profile_id == profile_id,
                )
            ).first()
            return record.to_match() if record else None

    def get_all_job_matches(self, profile_id: int) -> Dict[int, JobMatch]:
        with self.session() as session:
            records = session.scalars(
                select(JobMatchRecord).where(JobMatchRecord.profile_id == profile_id)
            ).all()
            return {r.job_id: r.to_match() for r in records}

    def invalidate_matches_for_profile(self, profile_id: int):
        with self.session() as session:
            session.query(JobMatchRecord).filter(
                JobMatchRecord.profile_id == profile_id
            ).delete()

    def get_all_job_ids(self) -> List[int]:
        with self.session() as session:
            return [r for r in session.scalars(select(JobRecord.id)).all()]