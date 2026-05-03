from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.ml.services import get_inference_service

from .models import Prediction
from .serializers import PredictionSerializer, PublicPredictionSerializer


class PredictionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = PredictionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return Prediction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        prediction = serializer.save(
            user=self.request.user,
            predicted_class="",
            confidence=0.0,
            probabilities={},
        )
        result = get_inference_service().predict(prediction.image.path)
        prediction.predicted_class = result["class"]
        prediction.confidence = result["confidence"]
        prediction.probabilities = result["probabilities"]
        prediction.save(
            update_fields=["predicted_class", "confidence", "probabilities"]
        )
        serializer.instance = prediction

    @action(detail=True, methods=["post"], url_path="toggle-public")
    def toggle_public(self, request, pk=None):
        instance = self.get_object()
        instance.is_public = not instance.is_public
        instance.save(update_fields=["is_public"])
        return Response(self.get_serializer(instance).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_gallery(request):
    """Recent public predictions, paginated by ?page=&page_size=."""
    try:
        page = max(1, int(request.GET.get("page", "1")))
    except ValueError:
        page = 1
    try:
        page_size = min(60, max(1, int(request.GET.get("page_size", "24"))))
    except ValueError:
        page_size = 24

    qs = Prediction.objects.filter(is_public=True).select_related("user")
    total = qs.count()
    start = (page - 1) * page_size
    items = qs[start : start + page_size]
    serializer = PublicPredictionSerializer(
        items, many=True, context={"request": request}
    )
    return Response(
        {
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def leaderboard(_request):
    """Top users by total prediction count, last 30 days."""
    from datetime import timedelta

    from django.db.models import Count
    from django.utils import timezone

    since = timezone.now() - timedelta(days=30)
    rows = (
        Prediction.objects.filter(created_at__gte=since)
        .values("user__email")
        .annotate(total=Count("id"))
        .order_by("-total")[:10]
    )
    return Response(
        {
            "since": since.isoformat(),
            "results": [
                {"handle": _anonymize(r["user__email"]), "total": r["total"]}
                for r in rows
            ],
        }
    )


def _anonymize(email: str) -> str:
    if not email or "@" not in email:
        return "anon"
    local, _, _ = email.partition("@")
    if len(local) <= 2:
        return local[0] + "*"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}"
