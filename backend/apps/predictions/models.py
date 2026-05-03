from django.conf import settings
from django.db import models


def upload_to(instance, filename: str) -> str:
    return f"uploads/user_{instance.user_id}/{filename}"


class Prediction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    image = models.ImageField(upload_to=upload_to)
    predicted_class = models.CharField(max_length=64)
    confidence = models.FloatField()
    probabilities = models.JSONField(default=dict)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "-created_at"))]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.predicted_class} ({self.confidence:.2f}) for {self.user_id}"
