from __future__ import annotations

import json
from scraper.parser import parse_api, _build_url


def test_parse_api_valid_jobs():
    raw_data = [
        {
            "IdOferta": 12345,
            "CargoVacante": "Python Developer",
            "NombreEmpresa": "Test Corp",
            "Ciudad": {"Nombre": "Montevideo"},
            "Pais": {"Nombre": "Uruguay"},
            "Descripcion": "A great job opportunity",
            "UrlOferta": "https://example.com/12345",
        }
    ]
    jobs = parse_api(raw_data)
    assert len(jobs) == 1
    assert jobs[0].title == "Python Developer"
    assert jobs[0].company == "Test Corp"


def test_parse_api_missing_id_returns_no_job():
    raw_data = [
        {
            "CargoVacante": "No ID Job",
            "NombreEmpresa": "Test Corp",
        }
    ]
    jobs = parse_api(raw_data)
    assert len(jobs) == 0


def test_parse_api_empty_list():
    jobs = parse_api([])
    assert jobs == []


def test_build_url_with_city():
    url = _build_url("12345", "Python Developer", "Montevideo")
    assert "12345" in url
    assert "python-developer" in url
    assert "montevideo" in url


def test_build_url_without_city():
    url = _build_url("12345", "React Developer", None)
    assert "12345" in url
    assert "react-developer" in url
    assert "uruguay" in url
