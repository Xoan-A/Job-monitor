from __future__ import annotations

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, JobRecord, Database


@pytest.fixture(scope="session")
def engine():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture()
def session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.rollback()
    session.close()


@pytest.fixture(autouse=True)
def _clean_db(engine):
    yield
    with engine.begin() as conn:
        conn.execute(JobRecord.__table__.delete())


@pytest.fixture()
def db(engine):
    database = Database.__new__(Database)
    database.engine = engine
    database.Session = sessionmaker(bind=engine, expire_on_commit=False)
    return database


@pytest.fixture()
def sample_job_data():
    return {
        "source": "test",
        "external_id": "12345",
        "title": "Software Engineer",
        "url": "https://example.com/jobs/12345",
        "company": "Test Corp",
        "description": "A great job opportunity",
        "city": "Montevideo",
        "country": "UY",
        "published_at": None,
        "modality": "Remote",
        "salary": "50000-70000",
        "job_type": "Full-time",
        "tags": ["Python", "FastAPI"],
        "experience_level": "Mid",
    }


@pytest.fixture()
def sample_jobs():
    from backend.models import Job

    return [
        Job(
            id=1001,
            title="Python Developer",
            url="https://example.com/1",
            company="Alpha Inc",
            description="Python developer needed",
            city="Montevideo",
            country="UY",
            source="test",
            tags=["Python", "Django"],
        ),
        Job(
            id=1002,
            title="React Developer",
            url="https://example.com/2",
            company="Beta Corp",
            description="React developer needed",
            city="Buenos Aires",
            country="AR",
            source="test",
            tags=["React", "TypeScript"],
        ),
    ]
