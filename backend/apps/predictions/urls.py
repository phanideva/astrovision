from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PredictionViewSet, leaderboard, public_gallery

router = DefaultRouter()
router.register(r"", PredictionViewSet, basename="prediction")

urlpatterns = [
    path("public/", public_gallery, name="prediction-public"),
    path("leaderboard/", leaderboard, name="prediction-leaderboard"),
    *router.urls,
]
