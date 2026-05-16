from rest_framework import serializers

from .models import Achievement, UserStat


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ["id", "code", "title", "description", "icon", "unlocked_at"]


class UserStatSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStat
        fields = [
            "predictions_count",
            "samples_explored",
            "pages_visited",
            "constellations_solved",
            "last_event_at",
        ]
