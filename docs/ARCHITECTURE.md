# Architecture

```mermaid
flowchart LR
    U([User Browser]) -->|HTTPS| FE[React + Vite SPA<br/>nginx :80]
    FE -->|Axios + JWT| API[Django REST Framework<br/>gunicorn :8000]
    API -->|psycopg2| DB[(PostgreSQL 16)]
    API -->|in-process<br/>singleton| ML{{InferenceService<br/>ResNet18 (PyTorch)}}
    API -->|MEDIA_ROOT| FS[(Volume:<br/>uploaded images)]
    ML -.loads weights.-> MA[(Volume:<br/>model_artifacts/*.pt)]
```

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

## Why no Express layer

The original brief mentioned Express. With Django REST Framework
already serving as the API, an Express BFF would be pure overhead for
this app — no SSR, no protocol translation, no auth aggregation needed.
Frontend talks to Django directly.

## Production-grade swaps (out of scope, documented for reference)

| Concern        | Dev (this repo)         | Production swap                      |
| -------------- | ----------------------- | ------------------------------------ |
| Image storage  | local `MEDIA_ROOT`      | S3 + `django-storages`               |
| Inference      | sync, in-process        | Celery + Redis worker pool           |
| Static serving | nginx in container      | CloudFront / static host             |
| Secrets        | `.env`                  | Cloud secret manager                 |
| Observability  | stdout                  | OpenTelemetry → tracing/metrics back end |
