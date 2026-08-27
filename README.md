# Job Monitor

Automated job scraping and monitoring pipeline with a full review workspace, built with n8n, Python/FastAPI, PostgreSQL and React.

![Frontend Overview](docs/screenshots/Frontend%20Overview.jpg)

## Stack

- **n8n** – workflow automation, scheduled scraping and Discord notifications
- **FastAPI (Python)** – scraper + REST API for jobs
- **PostgreSQL** – storage
- **React + TypeScript (Vite)** – web frontend

![Frontend Jobs and Filters](docs/screenshots/Frontend%20Jobs%20and%20Filters.jpg)

## Getting Started

1. Copy the environment file and set your values:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Open the apps:

   | Service      | URL                            |
   |--------------|--------------------------------|
   | Frontend     | http://localhost:5173          |
   | Scraper API  | http://localhost:8000/docs     |
   | n8n          | http://localhost:5678          |

The frontend proxies `/api/*` to `scraper-api` via nginx, so no CORS setup is needed in production.

If the API is unreachable the frontend automatically falls back to built-in demo data (switchable in *Settings → Data source*).

## Collecting jobs

```bash
# one-off scrape from the CLI service
docker compose run --rm scraper-cli scrape buscojobs --pages 3
docker compose run --rm scraper-cli scrape jooble --pages 2 --term "desarrollo"
docker compose run --rm scraper-cli scrape getonbrd --pages 1 --term ".NET"

# or trigger it from the API
curl -X POST http://localhost:8000/scrape -H "Content-Type: application/json" \
     -d '{"source": "buscojobs", "pages": 3}'
```

### Data sources

| Source | API | Full descriptions | Coverage |
|--------|-----|-------------------|----------|
| **Buscojobs** | REST API | Yes | Uruguay |
| **Jooble** | REST API | Snippets only (link to full listing) | Uruguay (aggregator) |
| **Get on Board** | Public API | Structured (description, functions, benefits, requirements) | LATAM (Chile, Argentina, Brazil, Mexico, Colombia, Peru, Uruguay) |

### Automation

![n8n Scraper Automation](docs/screenshots/n8n%20Scrapper%20automation%20and%20discord%20notification.jpg)

n8n handles scheduled scraping runs and sends Discord notifications when new jobs are found. Workflows are defined in `n8n/workflows/` and can be imported directly.

## API overview

| Endpoint              | Description                                          |
|-----------------------|------------------------------------------------------|
| `GET /jobs`           | Paginated list with filters (`q`, `source_only`, `remote`, `city`, `job_type`, `experience`, `user_status`, `saved`, `posted_within`, `discovered_within`, `has_salary`, `skill`) and sorting (`newest`, `oldest`, `company`, `relevance`, `salary`) |
| `GET /jobs/{id}`      | Job detail                                           |
| `PATCH /jobs/{id}`    | Update `user_status` / `is_saved` / `notes` / mark reviewed |
| `POST /jobs/bulk`     | Bulk status/save/review updates                      |
| `GET /jobs/facets`    | Distinct filter values with counts                   |
| `GET /jobs/purgeable` | Count of jobs older than N days                      |
| `DELETE /jobs/cleanup`| Remove jobs older than N days                        |
| `GET /stats/summary`  | Totals by status and source                          |
| `POST /scrape`        | Trigger a background scrape                          |
| `GET /health`         | Health check                                         |

### Match scores (optional)

Add skills to the `profile.skills` list in `scraper/config.yaml`. The API then computes a transparent keyword-overlap score per job (`match_score`, `match_strong`, `match_gaps`). Remove the section to disable matching entirely.

### User workflow state

Jobs carry review state used by the frontend: `user_status` (`new → reviewing → shortlisted → applied → interview → rejected/archived`), `is_saved`, `notes` and `reviewed_at`. Columns are added automatically on API startup if missing.

## Project Structure

```
job-monitor/
├── docker-compose.yml
├── frontend/            # React + TypeScript SPA (served by nginx)
│   ├── Dockerfile
│   ├── nginx.conf       # serves app + proxies /api -> scraper-api
│   ├── src/
│   └── src/test/        # vitest unit tests
├── scraper/             # Python scrapers + FastAPI (api.py)
│   ├── buscojobs_scraper.py
│   ├── jooble_scraper.py
│   ├── getonbrd_scraper.py
│   ├── api.py           # route handlers
│   ├── api_models.py    # Pydantic models
│   ├── api_filters.py   # query filter helpers
│   ├── utils.py         # shared utilities
│   └── tests/           # pytest unit tests
├── database/schema.sql  # reference schema
├── n8n/workflows/       # n8n automation workflows
└── docs/screenshots/    # UI and workflow screenshots
```

## Local frontend development

```bash
cd frontend
npm install
npm run dev        # dev server on :5173, proxies /api to localhost:8000
npm run build      # typecheck + production build
```

## Testing

### Backend tests (pytest)

```bash
# Run inside the scraper container
docker compose exec scraper-api pytest scraper/tests/ -v

# Or locally (requires Python + dependencies)
cd scraper
pip install -r requirements.txt
pytest tests/ -v
```

Tests cover: filter building, database upsert idempotency, parser field mapping, API model serialization.

### Frontend tests (vitest)

```bash
# Run inside the frontend container or locally
cd frontend
npm install
npm test
```

Tests cover: `sourceLabel()`, `decodeEntities()`, `timeAgo()`, `buildApiParams()` mapping, `ServiceError` handling.

## Further documentation

- `scraper/README.md` — scraper architecture, adding new sources, API reference
