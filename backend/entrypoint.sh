#!/usr/bin/env sh
set -e

echo "[entrypoint] applying migrations..."
python manage.py migrate --noinput

# Generate placeholder weights if none exist so the API never 500s
if [ ! -f model_artifacts/galaxy_cnn.pt ]; then
    echo "[entrypoint] no trained weights found, generating demo weights..."
    python scripts/make_demo_weights.py
fi

echo "[entrypoint] collecting static..."
python manage.py collectstatic --noinput || true

echo "[entrypoint] starting gunicorn..."
exec gunicorn astrovision.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers ${GUNICORN_WORKERS:-3} \
    --timeout 120
