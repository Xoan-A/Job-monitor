from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, Optional

import yaml

from .scraper.base_scraper import ScraperConfig


def _substitute_env(value: Any) -> Any:
    if isinstance(value, str):
        def replace(match: re.Match) -> str:
            var = match.group(1)
            return os.environ.get(var, match.group(0))
        return re.sub(r"\$\{([^}]+)\}", replace, value)
    if isinstance(value, dict):
        return {k: _substitute_env(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_substitute_env(v) for v in value]
    return value


def load_config(path: Optional[str] = None) -> Dict[str, Any]:
    config_path = Path(path) if path else Path(__file__).parent / "config.yaml"
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    return _substitute_env(raw)


def get_scraper_configs(config: Dict[str, Any]) -> Dict[str, ScraperConfig]:
    scrapers = {}
    for name, cfg in config.get("scrapers", {}).items():
        scrapers[name] = ScraperConfig(
            name=name,
            enabled=cfg.get("enabled", True),
            params=cfg.get("params", {}),
            rate_limit=cfg.get("rate_limit", 1.0),
        )
    return scrapers


def get_database_config(config: Dict[str, Any]) -> Dict[str, Any]:
    return config.get("database", {})


def get_scheduler_config(config: Dict[str, Any]) -> Dict[str, Any]:
    return config.get("scheduler", {})


def get_matching_config(config: Dict[str, Any]) -> Dict[str, Any]:
    return config.get("matching", {})