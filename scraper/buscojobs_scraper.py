from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import requests

from .base import BaseScraper, ScraperConfig, ScraperRegistry
from .models import Job
from .parser import parse_listing_html, parse_api
from .utils import slugify_url

logger = logging.getLogger(__name__)


@ScraperRegistry.register("buscojobs")
class BuscojobsScraper(BaseScraper):
    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.country = config.params.get("country", "uy")
        self.api_base = config.params.get("api_base", f"https://api.buscojobs.com/v3/{self.country}")
        self.site_base = config.params.get("site_base", f"https://www.buscojobs.com.uy")
        self.page_size = config.params.get("page_size", 15)
        self._api_endpoint = f"{self.api_base}/api/ofertas"

    def _get(self, url: str, **kwargs: Any) -> requests.Response:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
            "Accept-Language": "es-UY,es;q=0.9",
            "Referer": f"{self.site_base}/ofertas",
        }
        headers.update(kwargs.pop("headers", {}))
        self._rate_limit()
        try:
            response = requests.get(url, headers=headers, timeout=kwargs.pop("timeout", 30), **kwargs)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise RuntimeError(f"GET {url} failed: {exc}") from exc
        return response

    def fetch_page(self, page: int, page_size: int, term: Optional[str] = None) -> List[dict]:
        filters: Dict[str, Any] = {"limit": page_size, "skip": page_size * (page - 1)}
        if term:
            filters["where"] = {"BusquedaQue": term}
        params = {"filter": self._dumps(filters)}
        response = self._get(self._api_endpoint, params=params)
        data = response.json()
        if not isinstance(data, list):
            raise RuntimeError("Unexpected API response shape")
        return data

    def fetch_count(self, term: Optional[str] = None) -> int:
        where = {"BusquedaQue": term} if term else None
        params = {"where": self._dumps(where)} if where else {}
        response = self._get(f"{self.api_base}/api/ofertas/count", params=params)
        return int(response.json().get("count", 0))

    def parse(self, raw_data: List[dict]) -> List[Job]:
        return parse_api(raw_data)

    def fetch_listing_html(self, page: int = 1, term: Optional[str] = None) -> str:
        url = f"{self.site_base}/ofertas"
        if term:
            url = f"{url}/{slugify_url(term)}_"
        if page > 1:
            url = f"{url}/{page}"
        response = self._get(url)
        return response.text

    def parse_html(self, html: str) -> List[Job]:
        return parse_listing_html(html)

    @staticmethod
    def _dumps(value: Any) -> str:
        import json
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))