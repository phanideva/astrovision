from __future__ import annotations

from django.db import transaction
from django.utils import timezone

from .models import MissionProgress, Notification
from .serializers import missions_for_persona


def create_notification(user, *, kind: str, title: str, body: str = "", link: str = ""):
    return Notification.objects.create(
        user=user,
        kind=kind,
        title=title,
        body=body,
        link=link,
    )


@transaction.atomic
def increment_mission_progress(user, event: str):
    today = timezone.localdate()
    progress_rows: list[MissionProgress] = []

    for mission in missions_for_persona(user.persona):
        if mission.action_type != event:
            continue
        progress, _ = MissionProgress.objects.get_or_create(
            user=user,
            mission=mission,
            day=today,
            defaults={"count": 0},
        )
        progress.count += 1
        if progress.completed_at is None and progress.count >= mission.target_count:
            progress.completed_at = timezone.now()
            create_notification(
                user,
                kind=Notification.Kind.MISSION,
                title=f"Mission complete: {mission.title}",
                body="Visit missions to claim your reward.",
                link="/portal/missions",
            )
        progress.save(update_fields=["count", "completed_at", "updated_at"])
        progress_rows.append(progress)

    return progress_rows


def handle_event(user, event: str, unlocked_achievements=None):
    if unlocked_achievements is None:
        unlocked_achievements = []

    increment_mission_progress(user, event)

    for achievement in unlocked_achievements:
        create_notification(
            user,
            kind=Notification.Kind.ACHIEVEMENT,
            title=f"Achievement unlocked: {achievement.title}",
            body=achievement.description,
            link="/portal/achievements",
        )
