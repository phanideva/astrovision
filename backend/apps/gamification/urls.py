from django.urls import path

from . import views

urlpatterns = [
    path("me/", views.me_view, name="gamification-me"),
    path("event/", views.event_view, name="gamification-event"),
]
