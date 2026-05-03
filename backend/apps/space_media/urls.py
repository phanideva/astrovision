from django.urls import path

from . import views

urlpatterns = [
    path("apod/", views.apod_view, name="space-apod"),
    path("search/", views.search_view, name="space-search"),
    path("curated/", views.curated_view, name="space-curated"),
    path("proxy/", views.proxy_view, name="space-proxy"),
]
