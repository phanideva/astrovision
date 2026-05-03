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

DEFAULT_TIMEOUT = 10


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
