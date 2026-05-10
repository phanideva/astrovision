"""Thin clients for public NASA/ESA imagery APIs.

All calls are server-side so we can apply rate-limiting + caching
without leaking the API key to the browser.
"""

from __future__ import annotations

import logging
import os
from typing import Any
from urllib.parse import urlencode

import requests
from django.core.cache import cache

log = logging.getLogger(__name__)

NASA_API_KEY = os.environ.get("NASA_API_KEY", "DEMO_KEY")
APOD_URL = "https://api.nasa.gov/planetary/apod"
SEARCH_URL = "https://images-api.nasa.gov/search"
MARS_ROVER_URL = "https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos"
EPIC_URL = "https://api.nasa.gov/EPIC/api/natural"
EPIC_DATE_URL = "https://api.nasa.gov/EPIC/api/natural/date/{date}"
NEO_FEED_URL = "https://api.nasa.gov/neo/rest/v1/feed"
EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
LAUNCH_URL = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/"
EXOPLANET_TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

DEFAULT_TIMEOUT = 30


class NasaError(Exception):
    """Raised when an upstream NASA API call fails."""


def _get_json(url: str, params: dict[str, Any], cache_key: str, ttl: int) -> dict:
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    try:
        resp = requests.get(url, params=params, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as exc:
        log.warning("NASA API call failed: %s", exc)
        raise NasaError(str(exc)) from exc
    data = resp.json()
    cache.set(cache_key, data, ttl)
    return data


def fetch_apod(date: str | None = None) -> dict:
    """Astronomy Picture of the Day. Cached 6h (or 1h if date specified)."""
    params: dict[str, Any] = {"api_key": NASA_API_KEY, "thumbs": "true"}
    if date:
        params["date"] = date
    key = f"apod:{date or 'today'}"
    ttl = 3600 if date else 6 * 3600
    return _get_json(APOD_URL, params, key, ttl)


def search_media(query: str, page: int = 1, media_type: str = "image") -> dict:
    """NASA Image and Video Library search. Cached 5 min per (q, page)."""
    query = (query or "").strip()
    if not query:
        return {"collection": {"items": [], "metadata": {"total_hits": 0}}}
    params = {"q": query, "page": page, "media_type": media_type}
    key = f"nasa-search:{urlencode(params)}"
    return _get_json(SEARCH_URL, params, key, 300)


# ── New endpoints (v2) ────────────────────────────────────────────────


def fetch_mars_rover(
    rover: str = "curiosity",
    sol: str | None = None,
    earth_date: str | None = None,
    camera: str | None = None,
    page: int = 1,
) -> dict:
    """Mars Rover Photos. Cached 1h."""
    rover = (rover or "curiosity").lower()
    if rover not in {"curiosity", "perseverance", "opportunity", "spirit"}:
        rover = "curiosity"
    params: dict[str, Any] = {"api_key": NASA_API_KEY, "page": page}
    if sol:
        params["sol"] = sol
    elif earth_date:
        params["earth_date"] = earth_date
    else:
        params["sol"] = "1000"
    if camera:
        params["camera"] = camera
    key = f"mars:{rover}:{urlencode(params)}"
    return _get_json(MARS_ROVER_URL.format(rover=rover), params, key, 3600)


def fetch_epic(date: str | None = None) -> list:
    """DSCOVR EPIC daily Earth imagery. Cached 6h."""
    params = {"api_key": NASA_API_KEY}
    url = EPIC_DATE_URL.format(date=date) if date else EPIC_URL
    key = f"epic:{date or 'latest'}"
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        resp = requests.get(url, params=params, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise NasaError(str(exc)) from exc
    data = resp.json() or []
    cache.set(key, data, 6 * 3600)
    return data


def fetch_neo_feed(start: str | None = None, end: str | None = None) -> dict:
    """NeoWs near-Earth object feed. Cached 1h."""
    params: dict[str, Any] = {"api_key": NASA_API_KEY}
    if start:
        params["start_date"] = start
    if end:
        params["end_date"] = end
    key = f"neo:{urlencode(params)}"
    return _get_json(NEO_FEED_URL, params, key, 3600)


def fetch_eonet(limit: int = 20) -> dict:
    """EONET open natural events. Cached 30 min."""
    params = {"status": "open", "limit": limit}
    key = f"eonet:{urlencode(params)}"
    return _get_json(EONET_URL, params, key, 1800)


def fetch_next_launch(limit: int = 5) -> dict:
    """Launch Library 2 upcoming launches. Cached 30 min."""
    params = {"limit": limit, "hide_recent_previous": "true"}
    key = f"launch:{urlencode(params)}"
    return _get_json(LAUNCH_URL, params, key, 1800)


def fetch_exoplanets(limit: int = 200) -> list:
    """NASA Exoplanet Archive — confirmed planets. Cached 24h."""
    limit = max(1, min(int(limit or 200), 1000))
    query = (
        f"select top {limit} pl_name,hostname,disc_year,discoverymethod,"
        "pl_orbper,pl_rade,pl_bmasse,sy_dist "
        "from ps where default_flag=1 and pl_orbper is not null and pl_rade is not null"
    )
    params = {"query": query, "format": "json"}
    key = f"exo:{limit}"
    cached = cache.get(key)
    if cached is not None:
        return cached
    try:
        resp = requests.get(EXOPLANET_TAP_URL, params=params, timeout=45)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise NasaError(str(exc)) from exc
    data = resp.json() or []
    cache.set(key, data, 24 * 3600)
    return data
