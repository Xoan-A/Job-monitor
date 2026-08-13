# Job Monitor

Automated job scraping and monitoring pipeline built with n8n, Python, and PostgreSQL.

## Stack

- **n8n** – workflow automation and orchestration
- **PostgreSQL** – storage
- **Python** – job scraper

## Getting Started

1. Copy the environment file and set your values:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up -d
   ```

3. Open n8n at http://localhost:5678

## Services

| Service      | Image           | Port |
|--------------|-----------------|------|
| n8n          | n8nio/n8n       | 5678 |
| PostgreSQL   | postgres:16     | 5432 |

## Project Structure

```
job-monitor/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── n8n/
│   └── workflows/
├── scraper/
├── database/
├── tests/
└── docs/
```

## Roadmap

- [ ] Job scraper (Jooble API)
- [ ] n8n workflows
- [ ] Database schema
- [ ] Tests
