# AstroVision v2: Future Cosmos Lab

Created and maintained by [Phaneendra Sai Sri Devabhakthuni](https://www.linkedin.com/in/phanideva96/)

AstroVision is a full-stack AI web platform that classifies galaxy images and wraps the ML core in a futuristic space operations interface.

## What is included

- CNN-based galaxy classification pipeline (Galaxy10 SDSS style workflow)
- Mission Control dashboard (APOD, ISS telemetry, Kp index, NEO, launch data)
- Rich space modules (Mars Rover, EPIC Earth, Exoplanets, NEO Radar, Sky map, and more)
- Gamification system with achievements and progress tracking
- Dedicated authenticated Mission Portal with profile, missions, journal, collections, and notifications
- Toast notifications with close button and auto-dismiss behavior

## Technology stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, Vite 5, TypeScript, Framer Motion, Three.js / React Three Fiber |
| Backend | Django 5, Django REST Framework, SimpleJWT, PyTorch |
| Data proxies | NASA APIs, NOAA feeds, orbital and launch telemetry sources |
| Database | PostgreSQL (production), SQLite (quick local run) |
| Infra | Docker Compose, Render Blueprint, GitHub Actions |

## Quickstart A: Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

- App: http://localhost:3000
- API health: http://localhost:8000/api/health/
- Admin: http://localhost:8000/admin/

## Quickstart B: Local development

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

$env:DB_ENGINE="sqlite"
$env:DJANGO_SECRET_KEY="dev-secret-please-change"
$env:DJANGO_DEBUG="True"

python scripts/make_demo_weights.py
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

```powershell
cd frontend
copy .env.example .env
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

## One-click desktop launchers (Windows)

This repository now includes scripts and desktop shortcuts for start and stop:

- Start script: [scripts/launch_astrovision_localhost.ps1](scripts/launch_astrovision_localhost.ps1)
- Stop script: [scripts/stop_astrovision_localhost.ps1](scripts/stop_astrovision_localhost.ps1)

Expected desktop shortcuts:

- AstroVision Localhost.lnk
- Stop AstroVision Localhost.lnk

Start shortcut behavior:

- Opens backend server on port 8000
- Opens frontend dev server on port 3000
- Opens browser at http://localhost:3000

Stop shortcut behavior:

- Stops process listening on port 8000
- Stops process listening on port 3000

## API highlights

Base URL: `http://localhost:8000/api`

All authenticated endpoints require:

`Authorization: Bearer <token>`

Canonical endpoint map:

- Auth
  - `POST /auth/register/`
  - `POST /auth/login/`
  - `POST /auth/refresh/`
  - `GET /auth/me/`
  - `PATCH /auth/me/`
- Predictions
  - `POST /predictions/`
  - `GET /predictions/`
  - `GET /predictions/{id}/`
  - `DELETE /predictions/{id}/`
  - `GET /predictions/public/`
  - `GET /predictions/leaderboard/`
- Space media
  - `GET /space-media/apod/`
  - `GET /space-media/search/`
  - `GET /space-media/curated/`
  - `GET /space-media/proxy/`
  - `GET /space-media/mars-rover/`
  - `GET /space-media/epic/`
  - `GET /space-media/neo-feed/`
  - `GET /space-media/eonet/`
  - `GET /space-media/launch-next/`
  - `GET /space-media/exoplanets/`
- Gamification
  - `GET /gamification/me/`
  - `POST /gamification/event/`
- Portal
  - `GET /portal/summary/`
  - `GET /portal/missions/today/`
  - `POST /portal/missions/{code}/claim/`
  - `GET /portal/journal/`
  - `POST /portal/journal/`
  - `GET /portal/journal/{id}/`
  - `PATCH /portal/journal/{id}/`
  - `DELETE /portal/journal/{id}/`
  - `GET /portal/collections/`
  - `POST /portal/collections/`
  - `GET /portal/collections/{id}/`
  - `PATCH /portal/collections/{id}/`
  - `DELETE /portal/collections/{id}/`
  - `POST /portal/collections/{id}/items/`
  - `DELETE /portal/collections/{id}/items/{item_id}/`
  - `GET /portal/notifications/?unread=true|false`
  - `POST /portal/notifications/{id}/read/`
  - `POST /portal/notifications/read-all/`
  - `POST /portal/visit/`

Canonical examples:

```json
// POST /auth/register/
{
  "email": "alice@example.com",
  "password": "Sup3rStrong!",
  "display_name": "Alice",
  "persona": "enthusiast"
}
```

```json
// PATCH /auth/me/
{
  "display_name": "Alice Voyager",
  "persona": "researcher",
  "timezone": "Asia/Kolkata",
  "bio": "Galaxy enthusiast",
  "onboarded_at": "2026-05-16T10:15:10Z"
}
```

```json
// POST /portal/visit/
{ "module": "dashboard" }
```

## Repository layout

```text
astrovision/
  backend/
    apps/
      accounts/
      gamification/
      ml/
      portal/
      predictions/
      space_media/
    astrovision/
    tests/
  frontend/
    src/
      api/
      components/
      design/
      pages/
      portal/
      store/
    tests/
  docs/
  docker-compose.yml
  render.yaml
```

## Useful commands

```bash
# Backend lint and tests
cd backend && ruff check . && pytest -q

# Frontend tests and build
cd frontend && npm test && npm run build
```

## Deploy to Render

Use [render.yaml](render.yaml) Blueprint provisioning.

1. Push to GitHub
2. In Render, choose New -> Blueprint
3. Select this repository
4. Set NASA_API_KEY in Render env vars
5. Deploy

## Credits and data sources

- Galaxy10 SDSS dataset
- NASA APOD and NASA media APIs
- NOAA SWPC space weather feeds
- where-the-ISS telemetry
- Launch and exoplanet data providers

License: MIT
