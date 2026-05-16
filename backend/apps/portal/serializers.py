from django.db.models import Q
from rest_framework import serializers

from .models import Collection, CollectionItem, JournalEntry, Mission, MissionProgress, Notification


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = (
            "id",
            "title",
            "body_md",
            "mood",
            "linked_prediction",
            "pinned",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class CollectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionItem
        fields = ("id", "kind", "ref_id", "payload_json", "added_at")
        read_only_fields = ("id", "added_at")


class CollectionSerializer(serializers.ModelSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Collection
        fields = (
            "id",
            "name",
            "description",
            "cover_url",
            "is_public",
            "created_at",
            "items_count",
            "items",
        )
        read_only_fields = ("id", "created_at", "items_count", "items")


class MissionProgressSerializer(serializers.ModelSerializer):
    mission = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    is_claimed = serializers.SerializerMethodField()

    class Meta:
        model = MissionProgress
        fields = (
            "id",
            "day",
            "count",
            "completed_at",
            "claimed_at",
            "is_completed",
            "is_claimed",
            "mission",
        )

    def get_is_completed(self, obj):
        return obj.completed_at is not None

    def get_is_claimed(self, obj):
        return obj.claimed_at is not None

    def get_mission(self, obj):
        m = obj.mission
        return {
            "code": m.code,
            "title": m.title,
            "description": m.description,
            "persona": m.persona,
            "action_type": m.action_type,
            "target_count": m.target_count,
            "reward_xp": m.reward_xp,
        }


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ("id", "kind", "title", "body", "link", "read_at", "created_at", "is_read")
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None


class AddCollectionItemSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=CollectionItem.Kind.choices)
    ref_id = serializers.CharField(max_length=128)
    payload_json = serializers.JSONField(required=False)


class PortalSummarySerializer(serializers.Serializer):
    counts = serializers.DictField()
    recent_predictions = serializers.ListField()
    missions_today = serializers.ListField()
    recent_journal = JournalEntrySerializer(many=True)
    unread_notifications = serializers.IntegerField()
    suggested_module = serializers.CharField()


class MissionClaimSerializer(serializers.Serializer):
    code = serializers.CharField()


class MissionTodaySerializer(serializers.Serializer):
    items = serializers.ListField()


class MissionListQuerySerializer(serializers.Serializer):
    include_inactive = serializers.BooleanField(required=False, default=False)


class NotificationListQuerySerializer(serializers.Serializer):
    unread = serializers.BooleanField(required=False, default=False)


def missions_for_persona(persona: str):
    return Mission.objects.filter(active=True).filter(
        Q(persona=Mission.Persona.ALL) | Q(persona=persona)
    )
