from django.conf import settings
from django.db import models
from django.utils import timezone


class JournalEntry(models.Model):
    class Mood(models.TextChoices):
        INSPIRED = "inspired", "Inspired"
        CURIOUS = "curious", "Curious"
        ANALYTICAL = "analytical", "Analytical"
        CELEBRATORY = "celebratory", "Celebratory"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="journal_entries",
    )
    title = models.CharField(max_length=180)
    body_md = models.TextField(blank=True)
    mood = models.CharField(max_length=24, choices=Mood.choices, default=Mood.CURIOUS)
    linked_prediction = models.ForeignKey(
        "predictions.Prediction",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="journal_entries",
    )
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-pinned", "-created_at")
        indexes = [models.Index(fields=("user", "-created_at"))]


class Collection(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="collections",
    )
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    cover_url = models.URLField(blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        unique_together = (("user", "name"),)


class CollectionItem(models.Model):
    class Kind(models.TextChoices):
        PREDICTION = "prediction", "Prediction"
        APOD = "apod", "APOD"
        MARS_PHOTO = "mars_photo", "Mars Photo"
        EXOPLANET = "exoplanet", "Exoplanet"
        NEO = "neo", "NEO"
        EPIC = "epic", "EPIC"

    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name="items",
    )
    kind = models.CharField(max_length=24, choices=Kind.choices)
    ref_id = models.CharField(max_length=128)
    payload_json = models.JSONField(default=dict, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-added_at",)
        unique_together = (("collection", "kind", "ref_id"),)


class Mission(models.Model):
    class Persona(models.TextChoices):
        ALL = "all", "All"
        ENTHUSIAST = "enthusiast", "Enthusiast"
        STUDENT = "student", "Student / Educator"
        RESEARCHER = "researcher", "Researcher"

    class ActionType(models.TextChoices):
        PREDICT = "predict", "Predict"
        JOURNAL_CREATE = "journal_create", "Journal Create"
        COLLECTION_ADD = "collection_add", "Collection Add"
        MODULE_VISIT = "module_visit", "Module Visit"
        PAGE_VISIT = "page_visit", "Page Visit"

    code = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    persona = models.CharField(max_length=24, choices=Persona.choices, default=Persona.ALL)
    action_type = models.CharField(max_length=32, choices=ActionType.choices)
    target_count = models.PositiveIntegerField(default=1)
    reward_xp = models.PositiveIntegerField(default=25)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ("code",)


class MissionProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mission_progress",
    )
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name="progress_rows",
    )
    day = models.DateField(default=timezone.localdate)
    count = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("user", "mission", "day"),)
        ordering = ("-day", "-updated_at")


class Notification(models.Model):
    class Kind(models.TextChoices):
        MISSION = "mission", "Mission"
        ACHIEVEMENT = "achievement", "Achievement"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portal_notifications",
    )
    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.SYSTEM)
    title = models.CharField(max_length=180)
    body = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=("user", "-created_at")),
            models.Index(fields=("user", "read_at")),
        ]
