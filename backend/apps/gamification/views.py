from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Achievement
from .serializers import AchievementSerializer, UserStatSerializer
from .services import CATALOG, get_or_create_stat, record_event


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    stat = get_or_create_stat(request.user)
    unlocked = list(Achievement.objects.filter(user=request.user))
    unlocked_codes = {a.code for a in unlocked}
    return Response(
        {
            "stat": UserStatSerializer(stat).data,
            "achievements": AchievementSerializer(unlocked, many=True).data,
            "catalog": [
                {
                    "code": b.code,
                    "title": b.title,
                    "description": b.description,
                    "icon": b.icon,
                    "unlocked": b.code in unlocked_codes,
                }
                for b in CATALOG
            ],
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def event_view(request):
    event = (request.data.get("event") or "").strip()
    allowed = {
        "predict",
        "sample_open",
        "page_visit",
        "constellation_solved",
        "login",
        "journal_create",
        "collection_add",
        "module_visit",
    }
    if event not in allowed:
        return Response({"error": "invalid event"}, status=400)
    newly = record_event(request.user, event)
    return Response(
        {
            "unlocked": AchievementSerializer(newly, many=True).data,
        }
    )
