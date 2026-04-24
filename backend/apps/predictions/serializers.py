from rest_framework import serializers

from .models import Prediction

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB


class PredictionSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()

    class Meta:
        model = Prediction
        fields = (
            "id",
            "image",
            "predicted_class",
            "confidence",
            "probabilities",
            "created_at",
        )
        read_only_fields = (
            "id",
            "predicted_class",
            "confidence",
            "probabilities",
            "created_at",
        )

    def validate_image(self, value):
        if value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image exceeds 8 MB limit.")
        content_type = getattr(value, "content_type", None)
        if content_type and content_type.lower() not in ALLOWED_CONTENT_TYPES:
            raise serializers.ValidationError(
                "Only JPEG or PNG images are accepted."
            )
        return value
