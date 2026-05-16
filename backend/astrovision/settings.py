"""Django settings for AstroVision project."""

import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Project metadata ───────────────────────────────────────────────────────
AUTHOR = {
    "name": "Phaneendra Sai Sri Devabhakthuni",
    "role": "Creator & Owner",
    "email": "phanisaisri@gmail.com",
    "linkedin": "https://www.linkedin.com/in/phanideva96/",
}

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com").split(",")
    if h.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.predictions",
    "apps.ml",
    "apps.space_media",
    "apps.gamification",
    "apps.portal",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "astrovision.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "astrovision.wsgi.application"

# ── Database ──────────────────────────────────────────────────────────────
# Priority: DATABASE_URL (Render / 12-factor) → DB_ENGINE=sqlite → Postgres env
_DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
if _DATABASE_URL:
    try:
        import dj_database_url

        DATABASES = {
            "default": dj_database_url.parse(_DATABASE_URL, conn_max_age=600, ssl_require=False)
        }
    except ImportError:  # pragma: no cover
        # Fallback: assume sqlite path  e.g. sqlite:////app/data/db.sqlite3
        if _DATABASE_URL.startswith("sqlite:///"):
            DATABASES = {
                "default": {
                    "ENGINE": "django.db.backends.sqlite3",
                    "NAME": _DATABASE_URL.replace("sqlite:///", "", 1),
                }
            }
        else:
            raise
elif os.environ.get("DB_ENGINE", "postgres").lower() == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "astrovision"),
            "USER": os.environ.get("POSTGRES_USER", "astro"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "astro"),
            "HOST": os.environ.get("POSTGRES_HOST", "localhost"),
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
MEDIA_URL = "media/"
MEDIA_ROOT = Path(os.environ.get("MEDIA_ROOT", BASE_DIR / "media"))

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://localhost:5173",
    ).split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

# ML
_MODEL_DIR = Path(os.environ.get("MODEL_DIR", BASE_DIR / "model_artifacts"))
MODEL_WEIGHTS_PATH = Path(os.environ.get("MODEL_WEIGHTS_PATH", _MODEL_DIR / "galaxy_cnn.pt"))
CLASS_MAP_PATH = Path(os.environ.get("CLASS_MAP_PATH", _MODEL_DIR / "class_map.json"))

# NASA / external imagery
NASA_API_KEY = os.environ.get("NASA_API_KEY", "DEMO_KEY")

# Behind Render's HTTPS proxy
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# File upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# Cache (LocMem in dev — sufficient for APOD/search caching on a single dyno)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "astrovision-default",
    }
}
