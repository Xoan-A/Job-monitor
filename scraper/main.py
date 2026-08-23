from __future__ import annotations

import argparse
import json
import logging
import sys
from typing import List, Optional

from .base import ScraperRegistry
from .buscojobs_scraper import BuscojobsScraper
from .config import get_database_config, get_scraper_configs, load_config
from .database import Database
from .jooble_scraper import JoobleScraper
from .models import ScrapeResult

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def scrape(
    scraper_name: str,
    term: Optional[str] = None,
    pages: int = 1,
    page_size: int = 15,
    db: Optional[Database] = None,
) -> ScrapeResult:
    config = load_config()
    scraper_configs = get_scraper_configs(config)
    scraper_config = scraper_configs.get(scraper_name)
    if not scraper_config:
        raise ValueError(f"Scraper '{scraper_name}' not found in config")
    if not scraper_config.enabled:
        raise ValueError(f"Scraper '{scraper_name}' is disabled")

    scraper = ScraperRegistry.create(scraper_name, scraper_config)
    result = scraper.scrape(term=term, pages=pages, page_size=page_size)

    if db and result.jobs:
        stats = db.upsert_jobs(result.jobs)
        logger.info("DB upsert: %d new, %d updated", stats["new"], stats["updated"])

    return result


def list_scrapers() -> List[str]:
    config = load_config()
    scraper_configs = get_scraper_configs(config)
    return [name for name, cfg in scraper_configs.items() if cfg.enabled]


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description="Job Monitor - Multi-source scraper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scrape_parser = subparsers.add_parser("scrape", help="Scrape jobs from a source")
    scrape_parser.add_argument("source", help="Source name (buscojobs, jooble, etc.)")
    scrape_parser.add_argument("--term", help="Search term")
    scrape_parser.add_argument("--pages", type=int, default=1, help="Pages to scrape")
    scrape_parser.add_argument("--page-size", type=int, default=15, help="Results per page")
    scrape_parser.add_argument("--output", "-o", help="Output JSON file")
    scrape_parser.add_argument("--no-db", action="store_true", help="Skip database write")

    list_parser = subparsers.add_parser("list", help="List available scrapers")

    stats_parser = subparsers.add_parser("stats", help="Show database stats")
    stats_parser.add_argument("--source", help="Filter by source")

    args = parser.parse_args(argv)

    db = None
    if args.command in ("scrape", "stats") and not getattr(args, "no_db", False):
        try:
            config = load_config()
            db_config = get_database_config(config)
            db = Database(db_config)
            db.init_db()
        except Exception as exc:
            logger.warning("Database unavailable: %s", exc)
            db = None

    try:
        if args.command == "scrape":
            result = scrape(
                args.source,
                term=args.term,
                pages=args.pages,
                page_size=args.page_size,
                db=db,
            )
            payload = result.to_dict()
            if args.output:
                with open(args.output, "w", encoding="utf-8") as f:
                    json.dump(payload, f, ensure_ascii=False, indent=2)
            else:
                print(json.dumps(payload, ensure_ascii=False, indent=2))
            print(f"Scraped {len(result.jobs)} jobs (total on site: {result.total})", file=sys.stderr)

        elif args.command == "list":
            for name in list_scrapers():
                print(name)

        elif args.command == "stats":
            if not db:
                print("Database not available", file=sys.stderr)
                return 1
            count = db.get_job_count(args.source)
            print(f"Total jobs: {count}")

    except Exception as exc:
        logger.error("Error: %s", exc)
        return 1
    finally:
        if db:
            db.engine.dispose()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())