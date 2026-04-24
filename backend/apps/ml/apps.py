from django.apps import AppConfig


class MLConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ml"
    label = "ml"

    def ready(self) -> None:
        # Lazy import to avoid Django bootstrapping issues at import time.
        # The inference service is constructed on first use; importing here
        # only ensures the module is wired and tests can monkeypatch it.
        from . import services  # noqa: F401
