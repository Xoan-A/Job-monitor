from __future__ import annotations

import json
import re
import unicodedata
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup

from .models import Job

SITE_BASE = "https://www.buscojobs.com.uy"


def parse_listing_html(html: str) -> List[Job]:
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__", type="application/json")
    if script is None or not script.string:
        return []
    payload = json.loads(script.string)
    ofertas = payload["props"]["pageProps"]["resultadosIniciales"]["ofertas"]
    return [_map_job(raw) for raw in ofertas]


def parse_api(data: List[dict]) -> List[Job]:
    return [job for job in (_map_job(raw) for raw in data) if job is not None]


def _map_job(raw: Dict[str, Any]) -> Job:
    city = _nested(raw, "Ciudad", "Nombre")
    department = _nested(raw, "Departamento", "Nombre")
    country = _nested(raw, "Pais", "Nombre")
    raw_id = raw.get("IdOferta")
    url = raw.get("UrlOferta")
    if not url:
        url = _build_url(str(raw_id), raw.get("CargoVacante", ""), city)

    if raw_id is None:
        return None

    return Job(
        id=int(raw_id),
        title=raw.get("CargoVacante", ""),
        url=url,
        company=raw.get("NombreEmpresa"),
        description=raw.get("Descripcion"),
        city=city,
        department=department,
        country=country,
        published_at=raw.get("FechaInicio"),
        modality=_modality(raw),
        channel=_first_name(raw, "Canales"),
        subchannel=_first_name(raw, "SubCanales"),
        is_confidential=bool(raw.get("Confidencial", 0)),
        is_featured=bool(raw.get("DestacadaPortada") or raw.get("DestacadaListado")),
        company_id=raw.get("IdEmpresa"),
    )


def _modality(raw: Dict[str, Any]) -> str:
    if raw.get("PermiteTeletrabajo"):
        return "Teletrabajo"
    if raw.get("PermiteTrabajoHibrido"):
        return "Híbrido"
    if raw.get("PermiteHorarioFlexible"):
        return "Horario flexible"
    return "Presencial"


def _first_name(raw: Dict[str, Any], key: str) -> Optional[str]:
    items = raw.get(key)
    if isinstance(items, list) and items:
        return items[0].get("Nombre")
    return None


def _nested(raw: Dict[str, Any], outer: str, inner: str) -> Optional[str]:
    value = raw.get(outer)
    if isinstance(value, dict):
        return value.get(inner)
    return None


def _build_url(offer_id: str, title: str, city: Optional[str]) -> str:
    slug_title = _slugify(title)
    slug_city = _slugify(city or "uruguay")
    return f"{SITE_BASE}/{slug_title}-en-{slug_city}-ID-{offer_id}"


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-z0-9\s-]", "", text.lower())
    return re.sub(r"[\s-]+", "-", text).strip("-")