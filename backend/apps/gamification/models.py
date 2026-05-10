from django.conf import settings
from django.db import models


class Achievement(models.Model):
    """A badge unlocked by a user. (user, code) is unique."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="achievements",
    )
    code = models.CharField(max_length=64)
    title = models.CharField(max_length=128)
    description = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=32, default="trophy")
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "code")
        ordering = ["-unlocked_at"]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user_id}:{self.code}"


class UserStat(models.Model):
    """Lightweight rollup of activity counters per user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="stat",
    )
    predictions_count = models.IntegerField(default=0)
    samples_explored = models.IntegerField(default=0)
    pages_visited = models.IntegerField(default=0)
    constellations_solved = models.IntegerField(default=0)
    last_event_at = models.DateTimeField(auto_now=True)
