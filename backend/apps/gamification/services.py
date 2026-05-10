"""Achievement evaluation: deterministic, idempotent."""

from __future__ import annotations

from dataclasses import dataclass

from .models import Achievement, UserStat


@dataclass(frozen=True)
class Badge:
    code: str
    title: str
    description: str
    icon: str


CATALOG: list[Badge] = [
    Badge("first_contact", "First Contact", "Sign in to AstroVision for the first time.", "rocket"),
    Badge(
        "first_classify",
        "First Classification",
        "Run your first galaxy classification.",
        "telescope",
    ),
    Badge("ten_classify", "Galaxy Hunter", "Classify 10 galaxies.", "stars"),
    Badge("fifty_classify", "Sky Surveyor", "Classify 50 galaxies.", "trophy"),
    Badge("explorer", "Sample Explorer", "Open 5 sample galaxies.", "satellite"),
    Badge("navigator", "Mission Navigator", "Visit 10 different mission pages.", "compass"),
    Badge("stargazer", "Stargazer", "Solve a constellation puzzle.", "sparkles"),
    Badge("warp_master", "Warp Master", "Solve 10 constellation puzzles.", "bolt"),
]

CATALOG_BY_CODE = {b.code: b for b in CATALOG}


def get_or_create_stat(user) -> UserStat:
    stat, _ = UserStat.objects.get_or_create(user=user)
    return stat


def _unlock(user, code: str) -> Achievement | None:
    badge = CATALOG_BY_CODE.get(code)
    if not badge:
        return None
    obj, created = Achievement.objects.get_or_create(
        user=user,
        code=badge.code,
        defaults={
            "title": badge.title,
            "description": badge.description,
            "icon": badge.icon,
        },
    )
    return obj if created else None


def record_event(user, event: str) -> list[Achievement]:
    """Apply an event, update counters, return any newly-unlocked badges."""
    stat = get_or_create_stat(user)
    newly: list[Achievement] = []

    sign_in = _unlock(user, "first_contact")
    if sign_in:
        newly.append(sign_in)

    if event == "predict":
        stat.predictions_count += 1
        if stat.predictions_count == 1:
            b = _unlock(user, "first_classify")
            if b:
                newly.append(b)
        if stat.predictions_count >= 10:
            b = _unlock(user, "ten_classify")
            if b:
                newly.append(b)
        if stat.predictions_count >= 50:
            b = _unlock(user, "fifty_classify")
            if b:
                newly.append(b)
    elif event == "sample_open":
        stat.samples_explored += 1
        if stat.samples_explored >= 5:
            b = _unlock(user, "explorer")
            if b:
                newly.append(b)
    elif event == "page_visit":
        stat.pages_visited += 1
        if stat.pages_visited >= 10:
            b = _unlock(user, "navigator")
            if b:
                newly.append(b)
    elif event == "constellation_solved":
        stat.constellations_solved += 1
        if stat.constellations_solved >= 1:
            b = _unlock(user, "stargazer")
            if b:
                newly.append(b)
        if stat.constellations_solved >= 10:
            b = _unlock(user, "warp_master")
            if b:
                newly.append(b)

    stat.save()
    return newly
