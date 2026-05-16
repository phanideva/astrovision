from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CollectionViewSet,
    JournalEntryViewSet,
    MissionClaimView,
    MissionsTodayView,
    NotificationListView,
    PortalSummaryView,
    collection_add_item_view,
    collection_remove_item_view,
    notification_mark_all_read_view,
    notification_mark_read_view,
    visit_view,
)

router = DefaultRouter()
router.register(r"journal", JournalEntryViewSet, basename="portal-journal")
router.register(r"collections", CollectionViewSet, basename="portal-collections")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "collections/<int:pk>/items/", collection_add_item_view, name="portal-collection-item-add"
    ),
    path(
        "collections/<int:pk>/items/<int:item_id>/",
        collection_remove_item_view,
        name="portal-collection-item-remove",
    ),
    path("missions/today/", MissionsTodayView.as_view(), name="portal-missions-today"),
    path("missions/<str:code>/claim/", MissionClaimView.as_view(), name="portal-mission-claim"),
    path("notifications/", NotificationListView.as_view(), name="portal-notifications"),
    path(
        "notifications/<int:pk>/read/", notification_mark_read_view, name="portal-notification-read"
    ),
    path(
        "notifications/read-all/",
        notification_mark_all_read_view,
        name="portal-notification-read-all",
    ),
    path("summary/", PortalSummaryView.as_view(), name="portal-summary"),
    path("visit/", visit_view, name="portal-visit"),
]
