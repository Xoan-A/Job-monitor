from __future__ import annotations

from scraper.api_filters import _build_filters, _order_clause, _compute_match
from scraper.database import JobRecord


def test_build_filters_source():
    filters = _build_filters({"source": "jooble"})
    assert len(filters) == 1


def test_build_filters_q():
    filters = _build_filters({"q": "python"})
    assert len(filters) == 1


def test_build_filters_remote():
    filters = _build_filters({"remote": "remote"})
    assert len(filters) == 1


def test_build_filters_user_status():
    filters = _build_filters({"user_status": "applied"})
    assert len(filters) == 1


def test_build_filters_invalid_status_ignored():
    filters = _build_filters({"user_status": "invalid"})
    assert len(filters) == 0


def test_build_filters_multiple():
    filters = _build_filters({"source": "jooble", "q": "python", "remote": "remote"})
    assert len(filters) == 3


def test_order_clause_newest():
    clause = _order_clause("newest", None)
    assert len(clause) == 1


def test_order_clause_oldest():
    clause = _order_clause("oldest", None)
    assert len(clause) == 1


def test_order_clause_company():
    clause = _order_clause("company", None)
    assert len(clause) == 2


def test_order_clause_relevance_with_q():
    clause = _order_clause("relevance", "python")
    assert len(clause) == 2


def test_order_clause_relevance_without_q_falls_back_to_newest():
    clause = _order_clause("relevance", None)
    assert len(clause) == 1
