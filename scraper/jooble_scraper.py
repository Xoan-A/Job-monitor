from __future__ import annotations

import hashlib
import logging
import time
from typing import Any, Dict, List, Optional

import requests

from .base import BaseScraper, ScraperConfig, ScraperRegistry
from .models import Job

logger = logging.getLogger(__name__)


@ScraperRegistry.register("jooble")
class JoobleScraper(BaseScraper):
    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.api_key = config.params.get("api_key")
        self.api_base = config.params.get("api_base", "https://jooble.org/api")
        self.country = config.params.get("country", "uy")
        self.location = config.params.get("location", self.country)
        self.page_size = config.params.get("page_size", 20)
        self._last_request = 0.0

        if not self.api_key:
            raise ValueError("Jooble API key is required (set JOOBLE_API_KEY env var)")

    def _rate_limit(self):
        elapsed = time.time() - self._last_request
        if elapsed < self.config.rate_limit:
            time.sleep(self.config.rate_limit - elapsed)
        self._last_request = time.time()

    def _post(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.api_base}/{self.api_key}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self._rate_limit()
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"POST {url} failed: {exc}") from exc
        return response.json()

    def fetch_page(self, page: int, page_size: int, term: Optional[str] = None) -> List[dict]:
        payload = {
            "keywords": term or "",
            "location": self.location,
            "page": page,
            "ResultOnPage": page_size,
        }
        data = self._post(payload)
        jobs = data.get("jobs", [])
        if not isinstance(jobs, list):
            raise RuntimeError("Unexpected API response shape: 'jobs' not a list")
        return jobs

    def fetch_count(self, term: Optional[str] = None) -> int:
        payload = {"keywords": term or "", "location": self.location, "page": 1, "ResultOnPage": 1}
        data = self._post(payload)
        return int(data.get("totalCount", 0))

    def parse(self, raw_data: List[dict]) -> List[Job]:
        jobs: List[Job] = []
        for raw in raw_data:
            try:
                job = self._map_job(raw)
                if job.id:
                    jobs.append(job)
            except Exception as exc:
                logger.warning("Failed to parse Jooble job: %s", exc)
                continue
        return jobs

    def _map_job(self, raw: Dict[str, Any]) -> Job:
        job_id = raw.get("id") or raw.get("url") or ""
        if isinstance(job_id, str) and job_id.isdigit():
            job_id = int(job_id)
        elif not isinstance(job_id, int):
            job_id = int(hashlib.md5(str(job_id).encode()).hexdigest()[:8], 16)

        location = raw.get("location", {})
        company = raw.get("company", {})
        salary = raw.get("salary")

        tags = []
        if isinstance(raw.get("tags"), list):
            for tag in raw["tags"]:
                if isinstance(tag, dict) and tag.get("name"):
                    tags.append(tag["name"])
                elif isinstance(tag, str):
                    tags.append(tag)

        return Job(
            id=job_id,
            title=raw.get("title") or raw.get("jobTitle") or "",
            url=raw.get("link") or raw.get("url"),
            company=company.get("name") if isinstance(company, dict) else raw.get("company"),
            description=raw.get("snippet") or raw.get("description"),
            city=location.get("name") if isinstance(location, dict) else raw.get("location"),
            department=None,
            country=self.country.upper(),
            published_at=raw.get("updated_at") or raw.get("date") or raw.get("date_caption"),
            modality="Remote" if raw.get("is_remote") else "Presencial",
            channel="Jooble",
            subchannel=None,
            is_confidential=False,
            is_featured=False,
            company_id=None,
            source="jooble",
            salary=salary.get("value") if isinstance(salary, dict) else salary,
            job_type=raw.get("job_type"),
            tags=tags,
            experience_level=raw.get("experience"),
        )