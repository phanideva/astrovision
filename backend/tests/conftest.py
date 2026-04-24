import os

# Force SQLite + dummy weights for the test session so we never hit
# Postgres or load real PyTorch weights.
os.environ.setdefault("DB_ENGINE", "sqlite")
os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key-not-for-prod-usage-xx")
os.environ.setdefault("DJANGO_DEBUG", "False")

import pytest  # noqa: E402

from apps.ml import services as ml_services  # noqa: E402


class _FakeService:
    def predict(self, image_path):
        return {
            "class": "Spiral",
            "confidence": 0.91,
            "probabilities": {
                "Spiral": 0.91,
                "Elliptical": 0.05,
                "Irregular": 0.03,
                "Lenticular": 0.01,
            },
        }


@pytest.fixture(autouse=True)
def _patch_inference_service():
    ml_services.set_inference_service(_FakeService())
    yield
    ml_services.set_inference_service(None)
