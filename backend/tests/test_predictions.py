import io

import pytest
from django.contrib.auth import get_user_model
from PIL import Image
from rest_framework.test import APIClient

from apps.predictions.models import Prediction

User = get_user_model()


def _png_upload(name="g.png", size=(64, 64), color=(20, 30, 90)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    buf.seek(0)
    buf.name = name
    return buf


@pytest.fixture
def user(db):
    return User.objects.create_user(email="u@example.com", password="Sup3rStrong!")


@pytest.fixture
def auth_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def test_create_prediction(auth_client, user):
    resp = auth_client.post(
        "/api/predictions/",
        {"image": _png_upload()},
        format="multipart",
    )
    assert resp.status_code == 201, resp.content
    body = resp.json()
    assert body["predicted_class"] == "Spiral"
    assert 0.0 <= body["confidence"] <= 1.0
    assert set(body["probabilities"]) == {
        "Spiral",
        "Elliptical",
        "Irregular",
        "Lenticular",
    }
    assert Prediction.objects.filter(user=user).count() == 1


def test_list_only_own(auth_client, user):
    other = User.objects.create_user(email="o@example.com", password="Sup3rStrong!")
    Prediction.objects.create(
        user=other,
        image="uploads/x.png",
        predicted_class="Spiral",
        confidence=0.5,
        probabilities={},
    )
    resp = auth_client.get("/api/predictions/")
    assert resp.status_code == 200
    assert resp.json()["count"] == 0


def test_unauth_rejected():
    resp = APIClient().get("/api/predictions/")
    assert resp.status_code == 401


def test_reject_non_image(auth_client):
    bad = io.BytesIO(b"not an image")
    bad.name = "x.txt"
    resp = auth_client.post("/api/predictions/", {"image": bad}, format="multipart")
    assert resp.status_code == 400
