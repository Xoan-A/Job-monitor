from __future__ import annotations

from scraper.database import JobRecord
from scraper.models import Job


def test_upsert_creates_new_jobs(db, sample_jobs):
    db.upsert_jobs(sample_jobs)

    with db.session() as session:
        count = session.query(JobRecord).count()
        assert count == 2


def test_upsert_idempotent_no_duplicates(db, sample_jobs):
    db.upsert_jobs(sample_jobs)
    db.upsert_jobs(sample_jobs)

    with db.session() as session:
        count = session.query(JobRecord).count()
        assert count == 2


def test_upsert_updates_existing_fields(db, sample_jobs):
    db.upsert_jobs(sample_jobs)

    updated_jobs = [
        Job(
            id=1001,
            title="Senior Python Developer",
            url="https://example.com/1",
            company="Alpha Inc",
            description="Updated description",
            city="Montevideo",
            country="UY",
            source="test",
            tags=["Python", "Django", "FastAPI"],
        ),
    ]
    db.upsert_jobs(updated_jobs)

    with db.session() as session:
        record = session.query(JobRecord).filter_by(external_id="1001").first()
        assert record.title == "Senior Python Developer"
        assert "FastAPI" in record.tags

        count = session.query(JobRecord).count()
        assert count == 2
