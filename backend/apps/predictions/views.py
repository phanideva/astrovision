from rest_framework import mixins, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from apps.ml.services import get_inference_service

from .models import Prediction
from .serializers import PredictionSerializer


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
