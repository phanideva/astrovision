import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.portal.models import Collection, CollectionItem, JournalEntry, Mission, Notification

User = get_user_model()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="portal@example.com",
        password="Sup3rStrong!",
        persona="enthusiast",
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_journal_crud_scoped_to_user(auth_client, user):
    create = auth_client.post(
        "/api/portal/journal/",
        {"title": "Entry 1", "body_md": "hello", "mood": "curious"},
        format="json",
    )
    assert create.status_code == 201, create.content
    entry_id = create.json()["id"]

    other = User.objects.create_user(email="other@example.com", password="Sup3rStrong!")
    JournalEntry.objects.create(user=other, title="Other", body_md="x")

    listed = auth_client.get("/api/portal/journal/")
    assert listed.status_code == 200
    assert listed.json()["count"] == 1
    assert listed.json()["results"][0]["id"] == entry_id

    patch = auth_client.patch(
        f"/api/portal/journal/{entry_id}/",
        {"pinned": True},
        format="json",
    )
    assert patch.status_code == 200
    assert patch.json()["pinned"] is True


@pytest.mark.django_db
def test_collection_item_add_and_remove(auth_client, user):
    created = auth_client.post(
        "/api/portal/collections/",
        {"name": "My Set", "description": "favorites"},
        format="json",
    )
    assert created.status_code == 201
    collection_id = created.json()["id"]

    add_item = auth_client.post(
        f"/api/portal/collections/{collection_id}/items/",
        {"kind": "prediction", "ref_id": "123", "payload_json": {"a": 1}},
        format="json",
    )
    assert add_item.status_code == 201
    item_id = add_item.json()["id"]
    assert CollectionItem.objects.filter(collection_id=collection_id).count() == 1

    remove_item = auth_client.delete(f"/api/portal/collections/{collection_id}/items/{item_id}/")
    assert remove_item.status_code == 204
    assert CollectionItem.objects.filter(collection_id=collection_id).count() == 0


@pytest.mark.django_db
def test_mission_progress_and_claim(auth_client, user):
    mission = Mission.objects.create(
        code="t_predict_1",
        title="Predict once",
        persona="all",
        action_type="predict",
        target_count=1,
        reward_xp=25,
        active=True,
    )

    from apps.portal.services import handle_event

    handle_event(user, "predict")

    today = auth_client.get("/api/portal/missions/today/")
    assert today.status_code == 200
    items = today.json()["items"]
    row = next((it for it in items if it["mission"]["code"] == mission.code), None)
    assert row is not None
    assert row["count"] >= 1
    assert row["is_completed"] is True

    claim = auth_client.post(f"/api/portal/missions/{mission.code}/claim/")
    assert claim.status_code == 200
    assert claim.json()["reward_xp"] == 25


@pytest.mark.django_db
def test_summary_endpoint_shape(auth_client, user):
    Mission.objects.create(
        code="summary_predict_1",
        title="Predict once",
        persona="all",
        action_type="predict",
        target_count=1,
        reward_xp=25,
        active=True,
    )
    JournalEntry.objects.create(user=user, title="Log", body_md="hello")
    Notification.objects.create(user=user, title="n1", body="b")
    Collection.objects.create(user=user, name="C1")

    resp = auth_client.get("/api/portal/summary/")
    assert resp.status_code == 200
    body = resp.json()
    assert "counts" in body
    assert "missions_today" in body
    assert "recent_journal" in body
    assert "unread_notifications" in body


@pytest.mark.django_db
def test_notifications_mark_read(auth_client, user):
    n = Notification.objects.create(user=user, title="alert", body="body")

    list_resp = auth_client.get("/api/portal/notifications/?unread=true")
    assert list_resp.status_code == 200
    assert len(list_resp.json()["results"]) == 1

    read_resp = auth_client.post(f"/api/portal/notifications/{n.id}/read/")
    assert read_resp.status_code == 200
    assert read_resp.json()["ok"] is True

    mark_all = auth_client.post("/api/portal/notifications/read-all/")
    assert mark_all.status_code == 200
