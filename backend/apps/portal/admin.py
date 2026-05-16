from django.contrib import admin

from .models import Collection, CollectionItem, JournalEntry, Mission, MissionProgress, Notification


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "mood", "pinned", "created_at")
    search_fields = ("title", "user__email")
    list_filter = ("mood", "pinned")


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "is_public", "created_at")
    search_fields = ("name", "user__email")


@admin.register(CollectionItem)
class CollectionItemAdmin(admin.ModelAdmin):
    list_display = ("id", "collection", "kind", "ref_id", "added_at")
    search_fields = ("ref_id", "collection__name")
    list_filter = ("kind",)


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "title",
        "persona",
        "action_type",
        "target_count",
        "reward_xp",
        "active",
    )
    list_filter = ("persona", "action_type", "active")
    search_fields = ("code", "title")


@admin.register(MissionProgress)
class MissionProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "mission", "day", "count", "completed_at", "claimed_at")
    list_filter = ("day", "mission")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "kind", "title", "read_at", "created_at")
    list_filter = ("kind", "read_at")
    search_fields = ("title", "user__email")
