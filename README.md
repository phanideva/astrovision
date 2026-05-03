# 🌌 AstroVision

> **Created & maintained by [Phaneendra Sai Sri Devabhakthuni](https://www.linkedin.com/in/phanideva96/)**
> Full-stack engineer · ML practitioner · Space enthusiast
> 📧 [phanisaisri@gmail.com](mailto:phanisaisri@gmail.com) · 🔗 [LinkedIn](https://www.linkedin.com/in/phanideva96/)

End-to-end web app that classifies deep-space galaxy images into
morphological types — **Spiral**, **Elliptical**, **Irregular**, **Lenticular** —
using a CNN trained from scratch on the Galaxy10 SDSS dataset, and renders
an interactive 3D visualization of the prediction.

**Stack**

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Frontend | React 18 + Vite + TypeScript + Axios + react-three-fiber   |
| Backend  | Django 5 + Django REST Framework + SimpleJWT (PyTorch)     |
| Database | PostgreSQL 16 (SQLite for tests / quick local)             |
| ML       | ResNet18 (4-class head), trained from scratch via PyTorch  |
| Infra    | Docker + docker-compose, GitHub Actions CI                 |

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

python scripts/make_demo_weights.py     # placeholder weights
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend

Requires Node 20+.

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Visit http://localhost:3000 — register, log in, upload a galaxy image.

---

## Repository layout

```
astrovision/
├── backend/                 # Django + DRF + PyTorch
│   ├── astrovision/         # settings.py, urls.py
│   ├── apps/{accounts,predictions,ml}/
│   ├── ml_training/         # train.py, dataset.py
│   ├── scripts/             # make_demo_weights.py
│   ├── model_artifacts/     # *.pt + class_map.json (gitignored)
│   ├── tests/
│   └── Dockerfile
├── frontend/                # React + Vite + TS
│   ├── src/{api,components,pages,store}/
│   ├── tests/
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── docs/
    ├── API.md
    ├── ML_MODEL.md
    └── ARCHITECTURE.md
```

---

## Useful commands

```bash
# Backend tests
cd backend && pytest -v

# Frontend tests + build
cd frontend && npm test && npm run build

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

This repo ships with a [ender.yaml](./render.yaml) Blueprint that provisions
**both** services and a 1 GB persistent disk in one click.

### One-time setup

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com/), choose
   **New +  ?  Blueprint** and pick this repo.
3. Render reads ender.yaml and creates:
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
