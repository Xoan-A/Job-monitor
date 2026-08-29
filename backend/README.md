# Backend Module

Python scrapers + FastAPI REST API for collecting and serving job listings.

## Quick start

```bash
# Run a scrape via CLI
python -m backend.main scrape buscojobs --pages 3
python -m backend.main scrape jooble --pages 2 --term "desarrollo"
python -m backend.main scrape getonbrd --pages 1 --term ".NET"

# List available scrapers
python -m backend.main list

# Show DB stats
python -m backend.main stats
```

## Architecture

```
config.yaml          → scraper config (API keys, endpoints, rates)
    ↓
config.py            → loads YAML, substitutes ${ENV_VAR}
    ↓
BaseScraper ABC      → interface: fetch_page(), fetch_count(), parse()
    ↓
ScraperRegistry      → @register("name") decorator + factory
    ↓
models.Job           → universal job dataclass (contract between layers)
    ↓
Database.upsert_jobs → field-by-field diff, URL fallback dedup
    ↓
api.py               → FastAPI endpoints → JSON → frontend
```

## Adding a new scraper

### 1. Create `mysite_scraper.py`

```python
from __future__ import annotations
import hashlib, logging
from typing import Any, Dict, List, Optional
import requests
from .base import BaseScraper, ScraperConfig, ScraperRegistry
from .models import Job

logger = logging.getLogger(__name__)

@ScraperRegistry.register("mysite")
class MysiteScraper(BaseScraper):

    def __init__(self, config: ScraperConfig):
        super().__init__(config)
        self.api_base = config.params.get("api_base", "https://api.mysite.com")
        self.page_size = config.params.get("page_size", 20)

    def fetch_page(self, page: int, page_size: int, term: Optional[str] = None) -> List[dict]:
        params = {"page": page, "per_page": page_size}
        if term:
            params["q"] = term
        resp = requests.get(f"{self.api_base}/jobs", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json().get("results", [])

    def fetch_count(self, term: Optional[str] = None) -> int:
        params = {}
        if term:
            params["q"] = term
        resp = requests.get(f"{self.api_base}/jobs/count", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json().get("total", 0)

    def parse(self, raw_data: List[dict]) -> List[Job]:
        jobs = []
        for raw in raw_data:
            job_id = raw.get("id")
            if not job_id:
                continue
            if isinstance(job_id, str) and not job_id.isdigit():
                job_id = int(hashlib.md5(job_id.encode()).hexdigest()[:8], 16)
            jobs.append(Job(
                id=int(job_id),
                title=raw.get("title", ""),
                url=raw.get("url"),
                company=raw.get("company_name"),
                description=raw.get("description"),
                city=raw.get("city"),
                country=raw.get("country", "UY"),
                source="mysite",
            ))
        return jobs
```

### 2. Register it

Import the module in `__init__.py` and `main.py`:

```python
# __init__.py
from .mysite_scraper import MysiteScraper

# main.py (at the top, for side-effect registration)
from .mysite_scraper import MysiteScraper
```

### 3. Add config in `config.yaml`

```yaml
scrapers:
  mysite:
    enabled: true
    rate_limit: 1.5
    params:
      api_base: "https://api.mysite.com/v1"
      page_size: 20
```

### Key rules

- `Job.id` must be `int`. Hash string/UUIDs with `hashlib.md5` (not `hash()` — it's randomized per process).
- `Job.source` must match the registry name string.
- `(source, external_id)` is the unique key in the database.
- If the source provides a URL, the upsert also deduplicates by `(source, url)` as a fallback.

## Config reference

```yaml
scrapers:
  <name>:
    enabled: bool
    rate_limit: float          # seconds between pages
    params:                    # scraper-specific
      api_base: str
      page_size: int
      # ... other params

database:
  host: "${POSTGRES_HOST}"     # env-var substitution
  port: 5432
  user: "${POSTGRES_USER}"
  password: "${POSTGRES_PASSWORD}"
  name: "${POSTGRES_DB}"

profile:
  skills:                      # optional keyword-match scoring
    - "C#"
    - ".NET"
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/jobs` | Paginated list with filters and sorting |
| `GET` | `/jobs/facets` | Distinct filter values with counts |
| `GET` | `/jobs/purgeable?days=45` | Count of jobs older than N days |
| `GET` | `/jobs/{id}` | Job detail |
| `PATCH` | `/jobs/{id}` | Update status/saved/notes |
| `POST` | `/jobs/bulk` | Bulk update |
| `DELETE` | `/jobs/cleanup?days=45` | Remove old jobs |
| `GET` | `/stats/summary` | Dashboard totals |
| `POST` | `/scrape` | Trigger background scrape |
| `POST` | `/scrape/sync` | Run scrape synchronously |

## File overview

| File | Purpose |
|------|---------|
| `models.py` | `Job` and `ScrapeResult` dataclasses |
| `base.py` | `BaseScraper` ABC + `ScraperRegistry` + `ScraperConfig` |
| `config.py` | YAML loader with `${ENV_VAR}` substitution |
| `config.yaml` | Scraper configs, DB config, profile skills |
| `database.py` | SQLAlchemy ORM, upsert, migrations |
| `parser.py` | Buscojobs-specific field mapping |
| `buscojobs_scraper.py` | Buscojobs scraper |
| `jooble_scraper.py` | Jooble scraper |
| `getonbrd_scraper.py` | Get on Board scraper |
| `main.py` | CLI entry point |
| `api.py` | FastAPI REST API |
| `fetcher.py` | Legacy HTTP functions (unused by scrapers) |
