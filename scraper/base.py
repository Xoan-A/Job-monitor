from __future__ import annotations

import logging
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .models import Job, ScrapeResult

logger = logging.getLogger(__name__)


@dataclass
class ScraperConfig:
    name: str
    enabled: bool = True
    params: Dict[str, Any] = field(default_factory=dict)
    rate_limit: float = 1.0


class BaseScraper(ABC):
    def __init__(self, config: ScraperConfig):
        self.config = config
        self.name = config.name
        self.params = config.params
        self._last_request: float = 0.0

    def _rate_limit(self):
        elapsed = time.time() - self._last_request
        if elapsed < self.config.rate_limit:
            time.sleep(self.config.rate_limit - elapsed)
        self._last_request = time.time()

    @abstractmethod
    def fetch_page(self, page: int, page_size: int, term: Optional[str] = None) -> List[dict]:
        pass

    @abstractmethod
    def fetch_count(self, term: Optional[str] = None) -> int:
        pass

    @abstractmethod
    def parse(self, raw_data: List[dict]) -> List[Job]:
        pass

    def scrape(self, term: Optional[str] = None, pages: int = 1, page_size: int = 15) -> ScrapeResult:
        jobs: List[Job] = []
        for page in range(1, pages + 1):
            try:
                raw = self.fetch_page(page, page_size, term)
                jobs.extend(self.parse(raw))
            except Exception as exc:
                logger.error("Error scraping %s page %d: %s", self.name, page, exc)
                continue

        total = self.fetch_count(term)
        deduped = {job.id: job for job in jobs if job.id}
        return ScrapeResult(
            jobs=list(deduped.values()),
            total=total,
            pages=pages,
            source=self.name,
        )


class ScraperRegistry:
    _scrapers: Dict[str, type] = {}

    @classmethod
    def register(cls, name: str):
        def decorator(scraper_class: type):
            cls._scrapers[name] = scraper_class
            return scraper_class
        return decorator

    @classmethod
    def create(cls, name: str, config: ScraperConfig) -> BaseScraper:
        scraper_class = cls._scrapers.get(name)
        if not scraper_class:
            raise ValueError(f"Unknown scraper: {name}")
        return scraper_class(config)

    @classmethod
    def list_available(cls) -> List[str]:
        return list(cls._scrapers.keys())