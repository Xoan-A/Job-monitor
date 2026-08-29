from __future__ import annotations

import logging
import time
import unicodedata
import re
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s]+", "_", text)


def slugify_url(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    return re.sub(r"[\s-]+", "-", text).strip("-")


def _rate_limit(last_request_time: Optional[float], min_interval: float = 1.5) -> None:
    if last_request_time is not None:
        elapsed = time.time() - last_request_time
        if elapsed < min_interval:
            time.sleep(min_interval - elapsed)


class FetchError(Exception):
    pass


def fetch_json(url: str, headers: Optional[dict] = None, timeout: int = 30) -> dict:
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        raise FetchError(f"GET {url} failed: {exc}") from exc
