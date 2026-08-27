from __future__ import annotations

from scraper.models import Job, ScrapeResult


def test_job_to_dict():
    job = Job(
        id=12345,
        title="Python Developer",
        url="https://example.com/12345",
        company="Test Corp",
        description="A great job",
        city="Montevideo",
        country="UY",
        source="buscojobs",
        tags=["Python", "FastAPI"],
    )
    data = job.to_dict()

    assert data["id"] == 12345
    assert data["title"] == "Python Developer"
    assert data["tags"] == ["Python", "FastAPI"]
    assert data["source"] == "buscojobs"


def test_job_to_dict_minimal():
    job = Job(id=1, title="Test", source="test")
    data = job.to_dict()

    assert data["id"] == 1
    assert data["title"] == "Test"
    assert data["tags"] == []
    assert data["company"] is None


def test_scrape_result():
    jobs = [
        Job(id=1, title="Job 1", source="test"),
        Job(id=2, title="Job 2", source="test"),
    ]
    result = ScrapeResult(
        jobs=jobs,
        total=10,
        pages=2,
        source="test",
    )

    assert len(result.jobs) == 2
    assert result.total == 10
    assert result.pages == 2
    assert result.source == "test"
