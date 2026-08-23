from __future__ import annotations

from typing import Any, Dict, List, Optional

import requests

SITE_BASE = "https://www.buscojobs.com.uy"
API_BASE = "https://api.buscojobs.com/v3/uy"
LISTING_PATH = "/ofertas"

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/json,application/xhtml+xml,*/*",
    "Accept-Language": "es-UY,es;q=0.9",
    "Referer": f"{SITE_BASE}{LISTING_PATH}",
}


class FetchError(Exception):
    pass


def _get(url: str, **kwargs: Any) -> requests.Response:
    headers = {**DEFAULT_HEADERS, **kwargs.pop("headers", {})}
    try:
        response = requests.get(url, headers=headers, timeout=kwargs.pop("timeout", 30), **kwargs)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise FetchError(f"GET {url} failed: {exc}") from exc
    return response


def fetch_listing_html(page: int = 1, term: Optional[str] = None) -> str:
    url = f"{SITE_BASE}{LISTING_PATH}"
    if term:
        url = f"{url}/{_slugify(term)}_"
    if page > 1:
        url = f"{url}/{page}"
    return _get(url).text


def fetch_ofertas_api(page: int = 1, page_size: int = 15, term: Optional[str] = None, where: Optional[Dict[str, Any]] = None) -> List[dict]:
    filters: Dict[str, Any] = {"limit": page_size, "skip": page_size * (page - 1)}
    if where:
        filters["where"] = where
    elif term:
        filters["where"] = {"BusquedaQue": term}
    params = {"filter": _dumps(filters)}
    response = _get(f"{API_BASE}/api/ofertas", params=params)
    data = response.json()
    if not isinstance(data, list):
        raise FetchError("Unexpected API response shape")
    return data


def fetch_count_api(term: Optional[str] = None, where: Optional[Dict[str, Any]] = None) -> int:
    where = where or ({"BusquedaQue": term} if term else None)
    params = {"where": _dumps(where)} if where else {}
    response = _get(f"{API_BASE}/api/ofertas/count", params=params)
    return int(response.json().get("count", 0))


def _dumps(value: Any) -> str:
    import json

    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _slugify(text: str) -> str:
    import re
    import unicodedata

    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    return re.sub(r"[\s-]+", "-", text).strip("-")