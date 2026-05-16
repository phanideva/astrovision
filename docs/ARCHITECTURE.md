# Architecture

```mermaid
flowchart LR
    U([User Browser]) -->|HTTPS| FE[React + Vite SPA<br/>nginx :80]
    FE -->|Axios + JWT| API[Django REST Framework<br/>gunicorn :8000]
    API -->|psycopg2| DB[(PostgreSQL 16)]
    API -->|in-process<br/>singleton| ML{{InferenceService<br/>ResNet18 (PyTorch)}}
    API -->|MEDIA_ROOT| FS[(Volume:<br/>uploaded images)]
    ML -.loads weights.-> MA[(Volume:<br/>model_artifacts/*.pt)]
   API --> PORTAL[(Portal domain:<br/>missions, journal,<br/>collections, notifications)]
```

## New portal layer

The authenticated Mission Portal is a first-class application layer spanning frontend and backend:

- Frontend routes under `/portal/*`
- Backend routes under `/api/portal/*`
- Persona-aware summaries and daily missions
- Journal and collections stored per user
- Notification feed consumed by frontend toast host

## Request lifecycle — `POST /api/predictions/`

1. Browser uploads `multipart/form-data` (image) with the JWT bearer token.
2. Axios interceptor attaches `Authorization` header.
3. DRF `MultiPartParser` parses the file; `IsAuthenticated` enforces auth.
4. `PredictionViewSet.perform_create`:
   - Saves the image to `media/uploads/user_<id>/`.
   - Calls `get_inference_service().predict(path)`.
   - Updates the row with `predicted_class`, `confidence`, `probabilities`.
5. Response returned to the SPA → 3D viewer renders particles whose
   geometry depends on the predicted class.

6. `record_event(user, "predict")` is triggered and updates gamification stats.
7. Portal services can attach mission progress and notification side-effects.

## Why no Express layer

The original brief mentioned Express. With Django REST Framework
already serving as the API, an Express BFF would be pure overhead for
this app — no SSR, no protocol translation, no auth aggregation needed.
Frontend talks to Django directly.

## Local launcher workflow (Windows)

For local developer convenience, desktop shortcuts can call two PowerShell scripts:

- `scripts/launch_astrovision_localhost.ps1`
   - starts backend on `8000` and frontend on `3000`
   - opens `http://localhost:3000`
- `scripts/stop_astrovision_localhost.ps1`
   - stops listeners bound to `8000` and `3000`

These scripts are operational helpers and do not change the runtime architecture.

## Production-grade swaps (out of scope, documented for reference)

| Concern        | Dev (this repo)         | Production swap                      |
| -------------- | ----------------------- | ------------------------------------ |
| Image storage  | local `MEDIA_ROOT`      | S3 + `django-storages`               |
| Inference      | sync, in-process        | Celery + Redis worker pool           |
| Static serving | nginx in container      | CloudFront / static host             |
| Secrets        | `.env`                  | Cloud secret manager                 |
| Observability  | stdout                  | OpenTelemetry → tracing/metrics back end |
