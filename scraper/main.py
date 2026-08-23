from __future__ import annotations

import argparse
import json
import sys
from typing import List

from .fetcher import FetchError, fetch_count_api, fetch_listing_html, fetch_ofertas_api
from .models import Job, ScrapeResult
from .parser import parse_api, parse_listing_html


def scrape(term: str = None, pages: int = 1, page_size: int = 15, source: str = "api") -> ScrapeResult:
    jobs: List[Job] = []
    if source == "html":
        for page in range(1, pages + 1):
            html = fetch_listing_html(page=page, term=term)
            jobs.extend(parse_listing_html(html))
        total = len(jobs)
    else:
        for page in range(1, pages + 1):
            data = fetch_ofertas_api(page=page, page_size=page_size, term=term)
            jobs.extend(parse_api(data))
        total = fetch_count_api(term=term)

    deduped = {job.id: job for job in jobs if job.id}
    return ScrapeResult(
        jobs=list(deduped.values()),
        total=total,
        pages=pages,
        source=source,
    )


def main(argv: List[str] = None) -> int:
    parser = argparse.ArgumentParser(description="Buscojobs Uruguay scraper")
    parser.add_argument("--term", help="Search term, e.g. 'informatica'")
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to scrape (default: 1)")
    parser.add_argument("--page-size", type=int, default=15, help="Results per page (default: 15)")
    parser.add_argument("--source", choices=("api", "html"), default="api", help="Data source (default: api)")
    parser.add_argument("--output", "-o", help="Output JSON file path (default: stdout)")
    args = parser.parse_args(argv)

    try:
        result = scrape(term=args.term, pages=args.pages, page_size=args.page_size, source=args.source)
    except FetchError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    payload = result.to_dict()
    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
    else:
        print(json.dumps(payload, ensure_ascii=False, indent=2))

    print(f"scraped {len(result.jobs)} jobs (total on site: {result.total})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())