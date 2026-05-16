from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.models import Achievement, UserStat
from apps.predictions.models import Prediction
from apps.predictions.serializers import PredictionSerializer

from .models import Collection, CollectionItem, JournalEntry, MissionProgress, Notification
from .serializers import (
    AddCollectionItemSerializer,
    CollectionSerializer,
    JournalEntrySerializer,
    MissionProgressSerializer,
    NotificationListQuerySerializer,
    NotificationSerializer,
    missions_for_persona,
)
from .services import create_notification, handle_event


class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        entry = serializer.save(user=self.request.user)
        handle_event(self.request.user, "journal_create")
        create_notification(
            self.request.user,
            kind=Notification.Kind.SYSTEM,
            title="Journal updated",
            body=f"Entry '{entry.title}' saved.",
            link="/portal/journal",
        )


class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Collection.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def collection_add_item_view(request, pk: int):
    try:
        collection = Collection.objects.get(pk=pk, user=request.user)
    except Collection.DoesNotExist:
        return Response({"error": "collection not found"}, status=404)

    serializer = AddCollectionItemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    item, created = CollectionItem.objects.get_or_create(
        collection=collection,
        kind=serializer.validated_data["kind"],
        ref_id=serializer.validated_data["ref_id"],
        defaults={"payload_json": serializer.validated_data.get("payload_json", {})},
    )
    if not created and serializer.validated_data.get("payload_json") is not None:
        item.payload_json = serializer.validated_data["payload_json"]
        item.save(update_fields=["payload_json"])
    handle_event(request.user, "collection_add")
    return Response(
        {
            "id": item.id,
            "kind": item.kind,
            "ref_id": item.ref_id,
            "payload_json": item.payload_json,
            "added_at": item.added_at,
        },
        status=201 if created else 200,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def collection_remove_item_view(request, pk: int, item_id: int):
    try:
        item = CollectionItem.objects.get(
            pk=item_id, collection_id=pk, collection__user=request.user
        )
    except CollectionItem.DoesNotExist:
        return Response(status=404)
    item.delete()
    return Response(status=204)


class MissionsTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        missions = missions_for_persona(request.user.persona)
        for mission in missions:
            MissionProgress.objects.get_or_create(user=request.user, mission=mission, day=today)
        rows = (
            MissionProgress.objects.filter(user=request.user, day=today)
            .select_related("mission")
            .order_by("mission__code")
        )
        return Response({"items": MissionProgressSerializer(rows, many=True).data})


class MissionClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, code: str):
        today = timezone.localdate()
        try:
            progress = MissionProgress.objects.select_related("mission").get(
                user=request.user,
                mission__code=code,
                day=today,
            )
        except MissionProgress.DoesNotExist:
            return Response({"error": "mission progress not found"}, status=404)

        if progress.count < progress.mission.target_count:
            return Response({"error": "mission not complete"}, status=400)
        if progress.claimed_at is not None:
            return Response({"error": "already claimed"}, status=400)

        progress.claimed_at = timezone.now()
        progress.save(update_fields=["claimed_at", "updated_at"])

        create_notification(
            request.user,
            kind=Notification.Kind.MISSION,
            title=f"Reward claimed: {progress.mission.title}",
            body=f"+{progress.mission.reward_xp} XP credited.",
            link="/portal/missions",
        )
        return Response({"ok": True, "reward_xp": progress.mission.reward_xp})


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = NotificationListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        qs = Notification.objects.filter(user=request.user)
        if query.validated_data["unread"]:
            qs = qs.filter(read_at__isnull=True)
        qs = qs[:100]
        return Response({"results": NotificationSerializer(qs, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_mark_read_view(request, pk: int):
    updated = Notification.objects.filter(pk=pk, user=request.user, read_at__isnull=True).update(
        read_at=timezone.now()
    )
    return Response({"ok": bool(updated)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_mark_all_read_view(request):
    updated = Notification.objects.filter(user=request.user, read_at__isnull=True).update(
        read_at=timezone.now()
    )
    return Response({"ok": True, "updated": updated})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def visit_view(request):
    module = (request.data.get("module") or "").strip()
    if not module:
        return Response({"error": "module is required"}, status=400)
    handle_event(request.user, "module_visit")
    return Response({"ok": True})


class PortalSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stat = UserStat.objects.filter(user=request.user).first()
        if stat is None:
            stat = UserStat.objects.create(user=request.user)

        today = timezone.localdate()
        missions = missions_for_persona(request.user.persona)
        for mission in missions:
            MissionProgress.objects.get_or_create(user=request.user, mission=mission, day=today)

        mission_rows = MissionProgress.objects.filter(user=request.user, day=today).select_related(
            "mission"
        )
        recent_journal = JournalEntry.objects.filter(user=request.user)[:3]
        recent_predictions = Prediction.objects.filter(user=request.user)[:5]
        unread = Notification.objects.filter(user=request.user, read_at__isnull=True).count()

        suggestions_by_persona = {
            "enthusiast": "/portal/modules",
            "student": "/portal/journal",
            "researcher": "/portal/classify",
        }

        return Response(
            {
                "counts": {
                    "predictions": stat.predictions_count,
                    "samples_explored": stat.samples_explored,
                    "pages_visited": stat.pages_visited,
                    "constellations_solved": stat.constellations_solved,
                    "achievements": Achievement.objects.filter(user=request.user).count(),
                },
                "recent_predictions": PredictionSerializer(
                    recent_predictions,
                    many=True,
                    context={"request": request},
                ).data,
                "missions_today": MissionProgressSerializer(mission_rows, many=True).data,
                "recent_journal": JournalEntrySerializer(recent_journal, many=True).data,
                "unread_notifications": unread,
                "suggested_module": suggestions_by_persona.get(
                    request.user.persona, "/portal/modules"
                ),
            }
        )
