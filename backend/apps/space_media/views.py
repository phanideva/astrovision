"""Public read-only endpoints for NASA / curated imagery."""

from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlparse

import requests
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .services import NasaError, fetch_apod, search_media

CURATED_FILE = Path(__file__).resolve().parent / "curated.json"

# Strict allow-list to prevent SSRF.  Any new host must be added explicitly.
PROXY_ALLOWED_HOSTS = {
    "apod.nasa.gov",
    "images-assets.nasa.gov",
    "cdn.esahubble.org",
    "esahubble.org",
    "stsci-opo.org",
    "photojournal.jpl.nasa.gov",
    "epic.gsfc.nasa.gov",
    "mars.nasa.gov",
    "sdo.gsfc.nasa.gov",
    "services.swpc.noaa.gov",
}

PROXY_MAX_BYTES = 12 * 1024 * 1024  # 12 MB hard cap


@api_view(["GET"])
@permission_classes([AllowAny])
def apod_view(request):
    date = request.GET.get("date") or None
    try:
        return JsonResponse(fetch_apod(date))
    except NasaError as exc:
        return JsonResponse({"error": str(exc)}, status=502)


@api_view(["GET"])
@permission_classes([AllowAny])
def search_view(request):
    q = request.GET.get("q", "")
    try:
        page = max(1, int(request.GET.get("page", "1")))
    except ValueError:
        page = 1
    try:
        return JsonResponse(search_media(q, page))
    except NasaError as exc:
        return JsonResponse({"error": str(exc)}, status=502)


@api_view(["GET"])
@permission_classes([AllowAny])
def curated_view(_request):
    try:
        items = json.loads(CURATED_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        items = []
    return JsonResponse({"items": items})


@api_view(["GET"])
@permission_classes([AllowAny])
def proxy_view(request):
    """Stream an allow-listed image to the browser to bypass CORS."""
    url = request.GET.get("url", "")
    if not url:
        return JsonResponse({"error": "url required"}, status=400)
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return JsonResponse({"error": "invalid scheme"}, status=400)
    host = (parsed.hostname or "").lower()
    if host not in PROXY_ALLOWED_HOSTS:
        return JsonResponse({"error": "host not allowed"}, status=400)
    try:
        upstream = requests.get(url, timeout=15, stream=True)
        upstream.raise_for_status()
    except requests.RequestException as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    content_type = upstream.headers.get("Content-Type", "application/octet-stream")
    if not content_type.startswith(("image/", "video/")):
        return JsonResponse({"error": "unsupported content type"}, status=400)

    body = b""
    for chunk in upstream.iter_content(chunk_size=64 * 1024):
        body += chunk
        if len(body) > PROXY_MAX_BYTES:
            return JsonResponse({"error": "payload too large"}, status=413)
    resp = HttpResponse(body, content_type=content_type)
    resp["Cache-Control"] = "public, max-age=86400"
    resp["X-Content-Type-Options"] = "nosniff"
    return resp
