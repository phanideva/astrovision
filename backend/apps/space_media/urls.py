from django.urls import path

from . import views

urlpatterns = [
    path("apod/", views.apod_view, name="space-apod"),
    path("search/", views.search_view, name="space-search"),
    path("curated/", views.curated_view, name="space-curated"),
    path("proxy/", views.proxy_view, name="space-proxy"),
    path("mars-rover/", views.mars_rover_view, name="space-mars-rover"),
    path("epic/", views.epic_view, name="space-epic"),
    path("neo-feed/", views.neo_feed_view, name="space-neo-feed"),
    path("eonet/", views.eonet_view, name="space-eonet"),
    path("launch-next/", views.launch_next_view, name="space-launch-next"),
    path("exoplanets/", views.exoplanets_view, name="space-exoplanets"),
]
