import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
def test_register_and_login_flow():
    client = APIClient()
    resp = client.post(
        "/api/auth/register/",
        {"email": "alice@example.com", "password": "Sup3rStrongPass!"},
        format="json",
    )
    assert resp.status_code == 201, resp.content
    assert User.objects.filter(email="alice@example.com").exists()

    resp = client.post(
        "/api/auth/login/",
        {"email": "alice@example.com", "password": "Sup3rStrongPass!"},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.json() and "refresh" in resp.json()


@pytest.mark.django_db
def test_me_requires_auth():
    client = APIClient()
    assert client.get("/api/auth/me/").status_code == 401


@pytest.mark.django_db
def test_me_returns_user():
    user = User.objects.create_user(email="bob@example.com", password="Sup3rStrong!")
    client = APIClient()
    client.force_authenticate(user=user)
    resp = client.get("/api/auth/me/")
    assert resp.status_code == 200
    assert resp.json()["email"] == "bob@example.com"
