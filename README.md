# 🌌 AstroVision · v2 "Future Cosmos Lab"

> **Created & maintained by [Phaneendra Sai Sri Devabhakthuni](https://www.linkedin.com/in/phanideva96/)**
> Full-stack engineer · ML practitioner · Space enthusiast
> 📧 [phanisaisri@gmail.com](mailto:phanisaisri@gmail.com) · 🔗 [LinkedIn](https://www.linkedin.com/in/phanideva96/)

A futuristic, AI-powered command deck for the universe. AstroVision classifies
galaxy images with a CNN trained on the Galaxy10 SDSS dataset and surrounds
that ML core with a cinematic, scroll-driven HUD experience that pulls in
real-time data from NASA, NOAA, ESA, and orbital tracking services.

## ✨ What's new in v2

- **Cinematic HUD shell** — Orbitron / Space-Grotesk type, glitch headlines,
  cyan/violet/amber tone system, animated grid + scanline overlays, conic-gradient
  hover halos, framer-motion route transitions.
- **Boot splash** — futuristic terminal-style spool-up on first load.
- **Cosmic clock HUD** — fixed widget showing UTC, live ISS lat/lon, and
  T-minus to next launch.
- **Cinematic landing** — scroll-driven wormhole sequence (R3F + postprocessing
  bloom + vignette), live data marquee, holo feature grid.
- **Mission Control dashboard** — single deck for APOD · ISS telemetry · Kp · NEO
  count · open natural events · next launch.
- **Mars Rover feed** — Curiosity / Perseverance / Opportunity / Spirit, filterable
  by sol and camera with full-screen lightbox.
- **EPIC Earth observatory** — DSCOVR L1 daily imagery animated through the day,
  with full DSCOVR positional telemetry.
- **Exoplanet Atlas** — 5,000+ confirmed worlds, Recharts scatter (orbit period vs
  radius), filter by discovery method, search by host star.
- **NEO Radar** — animated polar sweep showing asteroids passing within ~20 lunar
  distances over the next 7 days, hazardous targets in pink.
- **Compare** — side-by-side analysis of any two of your saved classifications,
  with stacked probability bars.
- **Constellation Game** — connect-the-stars puzzles for Orion, Ursa Major,
  Cassiopeia. Solving unlocks a badge.
- **Achievements / Badge Locker** — eight badges (First Contact, Galaxy Hunter,
  Sky Surveyor, Sample Explorer, Mission Navigator, Stargazer, Warp Master, …),
  awarded automatically by a new `gamification` Django app.
- **Augmented Predict** — radar chart of class probabilities, **PDF mission report
  export** (jspdf + html2canvas), **voice narration** of the result via Web Speech.
- **Toast bus** — floating HUD notifications when badges unlock.

## 🛰 Stack (v2)

| Layer    | Tech                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| Frontend | React 18 · Vite 5 · TypeScript · framer-motion · @react-three/fiber + drei + postprocessing · recharts · jspdf · html2canvas · @tabler/icons-react · Orbitron / Space-Grotesk |
| Backend  | Django 5 · Django REST Framework · SimpleJWT · PyTorch (ResNet18, 4-class head)               |
| Proxies  | Server-side, cached: NASA APOD · Image library · Mars rovers · EPIC · NEO feed · EONET · Launch Library 2 · NASA Exoplanet Archive (TAP) |
| Database | PostgreSQL 16 (SQLite for tests / quick local)                                                |
| Infra    | Docker + docker-compose · Render Blueprint · GitHub Actions CI                                |

---

## Quickstart A — Docker (recommended, one command)

Requires Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- App:  http://localhost:3000
- API:  http://localhost:8000/api/health/
- Admin: http://localhost:8000/admin/  (`docker compose exec backend python manage.py createsuperuser`)

The backend container generates **placeholder model weights** on first
boot if none are present, so the API works immediately. Predictions are
random until you train a real model (see `docs/ML_MODEL.md`).

---

## Quickstart B — Local dev (no Docker)

### Backend

Requires Python 3.11+. Postgres optional — use SQLite for the fastest start.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Use SQLite for a no-DB-install run
$env:DB_ENGINE="sqlite"
$env:DJANGO_SECRET_KEY="dev-secret-please-change"
$env:DJANGO_DEBUG="True"

python scripts/make_demo_weights.py     # placeholder weights
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend

Requires Node 20+.

```powershell
cd frontend
copy .env.example .env
npm install --legacy-peer-deps
npm run dev
```

Visit **http://localhost:3000** — register, log in, upload a galaxy image,
explore the 12 mission modules.

> The first install uses `--legacy-peer-deps` because `postprocessing@6` peer-requires
> `three>=0.168` while `react-three/drei@9` still pins to `three@^0.166`. The runtime
> is fine on `three@0.169`.

---

## 🧭 New API endpoints (v2)

All under `/api/` and read-only public unless noted.

| Endpoint                                  | Purpose                                            |
| ----------------------------------------- | -------------------------------------------------- |
| `GET  /space-media/mars-rover/`           | Mars Rover Photos — `?rover=&sol=&earth_date=&camera=&page=` |
| `GET  /space-media/epic/`                 | DSCOVR EPIC daily Earth imagery — `?date=YYYY-MM-DD` |
| `GET  /space-media/neo-feed/`             | NeoWs near-Earth object feed — `?start=&end=`     |
| `GET  /space-media/eonet/`                | EONET open natural events — `?limit=`              |
| `GET  /space-media/launch-next/`          | Launch Library 2 upcoming launches — `?limit=`     |
| `GET  /space-media/exoplanets/`           | NASA Exoplanet Archive — `?limit=`                 |
| `GET  /gamification/me/` *(auth)*         | Current user's achievements + counters             |
| `POST /gamification/event/` *(auth)*      | Record an activity event, return any new badges    |

All upstream calls are server-side, allow-listed, and cached (1 h–24 h depending
on freshness needs) so the front-end never hits external rate limits and the
NASA API key never leaks to the browser.

---

## Repository layout

```
astrovision/
├── backend/                 # Django + DRF + PyTorch
│   ├── astrovision/         # settings.py, urls.py
│   ├── apps/{accounts,predictions,ml,space_media,gamification}/
│   ├── ml_training/         # train.py, dataset.py
│   ├── scripts/             # make_demo_weights.py
│   ├── model_artifacts/     # *.pt + class_map.json (gitignored)
│   ├── tests/
│   └── Dockerfile
├── frontend/                # React + Vite + TS
│   ├── src/
│   │   ├── api/             # axios clients (predictions, spaceMedia, gamification)
│   │   ├── design/          # HUD primitives: HudPanel, NeonButton, GlitchText, Reveal, Stat, Typewriter, toast bus, ToastHost, hud.css
│   │   ├── three/           # R3F primitives: Wormhole, BloomScene
│   │   ├── components/      # BootSplash, CosmicClock, CosmicBackground, ApodHero, …
│   │   ├── pages/           # Home, Dashboard, MarsRover, EpicEarth, Exoplanets, NeoRadar, Compare, ConstellationGame, Achievements, Predict, History, …
│   │   └── store/
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── docs/{API.md, ML_MODEL.md, ARCHITECTURE.md}
```

---

## Useful commands

```bash
# Backend tests
cd backend && pytest -v

# Frontend type-check + tests + production build
cd frontend && npx tsc -b --noEmit && npm test -- --run && npm run build

# Train the model (after downloading Galaxy10.h5 — see docs/ML_MODEL.md)
cd backend && python ml_training/train.py --data path/to/Galaxy10.h5 --epochs 15

# Reset DB volume
docker compose down -v
```

---

## Honest scope note

Galaxy morphology classification is a well-studied problem (Galaxy Zoo,
SDSS, dozens of published CNNs). AstroVision is a polished, end-to-end,
portfolio-grade implementation — not a research breakthrough. The aim
is a complete, reproducible, fully-tested AI web application stack.

---

## ?? Deploy to Render (auto-deploy on push)

This repo ships with a [
ender.yaml](./render.yaml) Blueprint that provisions
**both** services and a 1 GB persistent disk in one click.

### One-time setup

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com/), choose
   **New +  ?  Blueprint** and pick this repo.
3. Render reads 
ender.yaml and creates:
   - `astrovision-backend` � Docker web service (Django + DRF + PyTorch),
     persistent disk mounted at `/app/data`, SQLite stored on disk so
     uploads + predictions survive redeploys.
   - `astrovision-frontend` � Static site (Vite/React build).
4. When prompted, paste your free **NASA API key** from
   <https://api.nasa.gov/> into `NASA_API_KEY` (`DEMO_KEY` works but is
   rate-limited).
5. The first build runs the ML weights bootstrap (placeholder weights are
   created if none are committed) and migrations.

### Auto-deploy

Both services have `autoDeploy: true` and watch the `main` branch.
Every `git push origin main` triggers a fresh build + deploy on Render �
no extra CI step required.

> Once live, your URLs will be
> `https://astrovision-backend.onrender.com` and
> `https://astrovision-frontend.onrender.com`.

---

## ?? Credits & Data Sources

- **Galaxy10 SDSS** dataset � Bovy et al. (training data)
- **NASA APOD API** � daily astronomy picture
- **NASA Image & Video Library** (images-api.nasa.gov)
- **NASA SDO** � Solar Dynamics Observatory imagery
- **NOAA SWPC** � geomagnetic / Kp-index space-weather feed
- **wheretheiss.at** � live ISS position telemetry
- **Stellarium Web** � embedded interactive sky map
- **NASA / ESA / Hubble / JWST** � public-domain imagery used in the curated gallery
- **PyTorch � React � three.js � Django � DRF** � open-source foundations

Built with ? by **Phaneendra Sai Sri Devabhakthuni** �
[LinkedIn](https://www.linkedin.com/in/phanideva96/) �
[Email](mailto:phanisaisri@gmail.com)

� 2025 AstroVision. Released under the MIT License.
