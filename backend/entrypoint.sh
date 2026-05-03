#!/usr/bin/env sh
set -e

# Honor MEDIA_ROOT / MODEL_DIR (Render persistent disk).  Defaults match dev.
MEDIA_ROOT="${MEDIA_ROOT:-/app/media}"
MODEL_DIR="${MODEL_DIR:-/app/model_artifacts}"
mkdir -p "$MEDIA_ROOT" "$MODEL_DIR"
export MEDIA_ROOT MODEL_DIR

echo "[entrypoint] applying migrations..."
python manage.py migrate --noinput

# Generate placeholder weights if none exist so the API never 500s
if [ ! -f "$MODEL_DIR/galaxy_cnn.pt" ]; then
    echo "[entrypoint] no trained weights found, generating demo weights..."
    python scripts/make_demo_weights.py || true
fi

echo "[entrypoint] collecting static..."
python manage.py collectstatic --noinput || true

PORT="${PORT:-8000}"
echo "[entrypoint] starting gunicorn on 0.0.0.0:${PORT}..."
exec gunicorn astrovision.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}"
