from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import requests

from .base import BaseScraper, ScraperConfig, ScraperRegistry
from .models import Job

logger = logging.getLogger(__name__)


@ScraperRegistry.register("getonbrd")
class GetonbrdScraper(BaseScraper):
    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.api_base = config.params.get("api_base", "https://www.getonbrd.com/api/v0")
        self.country_code = config.params.get("country_code", "UY")
        self.page_size = config.params.get("page_size", 120)
        self.lang = config.params.get("lang", "en")
        self._last_request = 0.0

    def _rate_limit(self):
        elapsed = time.time() - self._last_request
        if elapsed < self.config.rate_limit:
            time.sleep(self.config.rate_limit - elapsed)
        self._last_request = time.time()

    def _get(self, url: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        headers = {
            "Accept": "application/json",
            "Accept-Language": f"{self.lang},en;q=0.9,es;q=0.8",
        }
        self._rate_limit()
        try:
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"GET {url} failed: {exc}") from exc
        return response.json()

    def fetch_page(self, page: int, page_size: int, term: Optional[str] = None) -> List[dict]:
        params: Dict[str, Any] = {
            "per_page": page_size,
            "page": page,
            "lang": self.lang,
            "country_code": self.country_code,
        }
        if term:
            params["query"] = term
        data = self._get(f"{self.api_base}/search/jobs", params=params)
        raw_jobs = data.get("data", [])
        if not isinstance(raw_jobs, list):
            raise RuntimeError("Unexpected API response shape: 'data' not a list")
        return raw_jobs

    def fetch_count(self, term: Optional[str] = None) -> int:
        params: Dict[str, Any] = {
            "per_page": 1,
            "page": 1,
            "lang": self.lang,
            "country_code": self.country_code,
        }
        if term:
            params["query"] = term
        data = self._get(f"{self.api_base}/search/jobs", params=params)
        meta = data.get("meta", {})
        total_pages = int(meta.get("total_pages", 0) or 0)
        per_page = int(meta.get("per_page", 1) or 1)
        data_count = len(data.get("data", []))
        if total_pages <= 1:
            return data_count
        return (total_pages - 1) * per_page + data_count

    def parse(self, raw_data: List[dict]) -> List[Job]:
        jobs: List[Job] = []
        for raw in raw_data:
            try:
                job = self._map_job(raw)
                if job.id:
                    jobs.append(job)
            except Exception as exc:
                logger.warning("Failed to parse Get on Board job: %s", exc)
                continue
        return jobs

    def _map_job(self, raw: dict) -> Job:
        attrs = raw.get("attributes", raw)

        job_id = raw.get("id", "")
        if isinstance(job_id, str) and job_id.isdigit():
            job_id = int(job_id)
        elif isinstance(job_id, str):
            job_id = hash(job_id) & 0x7FFFFFFF

        title = attrs.get("title", "")

        company_ref = attrs.get("company")
        company = None
        if isinstance(company_ref, dict):
            company_data = company_ref.get("data", {})
            company = company_data.get("attributes", {}).get("name") or company_data.get("name")

        description_parts = []
        for field in ("description", "functions", "benefits", "desirable"):
            content = attrs.get(field)
            if content:
                description_parts.append(content)
        description = "\n\n".join(description_parts) if description_parts else None

        cities = attrs.get("location_cities", [])
        regions = attrs.get("location_regions", [])
        city = None
        if cities and isinstance(cities, list):
            city = cities[0] if isinstance(cities[0], str) else str(cities[0])
        elif regions and isinstance(regions, list):
            region_data = regions[0]
            if isinstance(region_data, dict):
                city = region_data.get("attributes", {}).get("name") or region_data.get("id")
            else:
                city = str(region_data)

        countries = attrs.get("countries", [])
        country = None
        if countries and isinstance(countries, list):
            country = countries[0] if isinstance(countries[0], str) else str(countries[0])

        modality = None
        remote = attrs.get("remote", False)
        remote_modality = attrs.get("remote_modality")
        if remote:
            modality = "Remote"
        elif remote_modality:
            modality = remote_modality

        min_salary = attrs.get("min_salary")
        max_salary = attrs.get("max_salary")
        salary = None
        if min_salary and max_salary:
            salary = f"${min_salary} - ${max_salary}"
        elif min_salary:
            salary = f"${min_salary}+"
        elif max_salary:
            salary = f"Up to ${max_salary}"

        tags = []
        raw_tags = attrs.get("tags", [])
        if isinstance(raw_tags, list):
            for tag in raw_tags:
                if isinstance(tag, dict):
                    tag_name = tag.get("name") or tag.get("value")
                    if tag_name:
                        tags.append(str(tag_name))
                elif isinstance(tag, str):
                    tags.append(tag)

        published_at = attrs.get("published_at")
        if isinstance(published_at, (int, float)) and published_at > 0:
            from datetime import datetime, timezone
            published_at = datetime.fromtimestamp(published_at, tz=timezone.utc).isoformat()

        seniority = attrs.get("seniority")
        if isinstance(seniority, dict):
            seniority = seniority.get("data", {}).get("id") or seniority.get("name")
        category = attrs.get("category_name")

        modality_raw = attrs.get("modality")
        if isinstance(modality_raw, dict):
            modality_raw = modality_raw.get("data", {}).get("id") or modality_raw.get("name")

        slug = raw.get("id", "")
        url = f"https://www.getonbrd.com/jobs/{slug}" if isinstance(slug, str) and slug else None

        return Job(
            id=job_id,
            title=title,
            url=url,
            company=company,
            description=description,
            city=city,
            department=category,
            country=country or self.country_code.upper(),
            published_at=published_at,
            modality=modality,
            channel="Get on Board",
            subchannel=None,
            is_confidential=False,
            is_featured=False,
            company_id=company_ref.get("data", {}).get("id") if isinstance(company_ref, dict) else None,
            source="getonbrd",
            salary=salary,
            job_type=modality_raw,
            tags=tags,
            experience_level=seniority,
        )
