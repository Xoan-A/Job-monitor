# Job Monitor

Automated job scraping and monitoring pipeline with a full review workspace, built with n8n, Python/FastAPI, PostgreSQL and React.

## Stack

- **n8n** – workflow automation and orchestration
- **FastAPI (Python)** – scraper + REST API for jobs
- **PostgreSQL** – storage
- **React + TypeScript (Vite)** – web frontend

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

# or trigger it from the API
curl -X POST http://localhost:8000/scrape -H "Content-Type: application/json" \
     -d '{"source": "buscojobs", "pages": 3}'
```

## API overview

| Endpoint              | Description                                          |
|-----------------------|------------------------------------------------------|
| `GET /jobs`           | Paginated list with filters (`q`, `source_only`, `remote`, `city`, `job_type`, `experience`, `user_status`, `saved`, `posted_within`, `has_salary`, `skill`) and sorting (`newest`, `oldest`, `company`, `relevance`, `salary`) |
| `GET /jobs/{id}`      | Job detail                                           |
| `PATCH /jobs/{id}`    | Update `user_status` / `is_saved` / `notes` / mark reviewed |
| `POST /jobs/bulk`     | Bulk status/save/review updates                      |
| `GET /jobs/facets`    | Distinct filter values with counts                   |
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
│   └── src/
├── scraper/             # Python scrapers + FastAPI (api.py)
├── database/schema.sql  # reference schema
├── n8n/workflows/
└── docs/
```

## Local frontend development

```bash
cd frontend
npm install
npm run dev        # dev server on :5173, proxies /api to localhost:8000
npm run build      # typecheck + production build
```

## Roadmap

- [x] Job scrapers (Buscojobs, Jooble)
- [x] REST API with user workflow state
- [x] Web review workspace
- [ ] n8n scheduled workflows
- [ ] Tests
