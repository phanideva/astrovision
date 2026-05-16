# API Reference

Base URL: `http://localhost:8000/api`

All authenticated endpoints require a JWT in the `Authorization: Bearer <token>` header.

## Auth

### `POST /auth/register/`

```json
// request
{
  "email": "alice@example.com",
  "password": "Sup3rStrong!",
  "display_name": "Alice",
  "persona": "enthusiast"
}
// 201
{
  "id": 1,
  "email": "alice@example.com",
  "display_name": "Alice",
  "persona": "enthusiast"
}
```

### `POST /auth/login/`

```json
// request
{ "email": "alice@example.com", "password": "Sup3rStrong!" }
// 200
{ "access": "<jwt>", "refresh": "<jwt>" }
```

### `POST /auth/refresh/`

```json
{ "refresh": "<jwt>" }
// 200
{ "access": "<jwt>" }
```

### `GET /auth/me/`

```json
// 200
{
  "id": 1,
  "email": "alice@example.com",
  "date_joined": "2026-04-23T10:00:00Z",
  "persona": "enthusiast",
  "display_name": "Alice",
  "avatar_seed": "alice-abc123",
  "bio": "",
  "onboarded_at": null,
  "timezone": "UTC"
}
```

### `PATCH /auth/me/`

```json
// request
{
  "display_name": "Alice Voyager",
  "persona": "researcher",
  "timezone": "Asia/Kolkata",
  "bio": "Galaxy enthusiast",
  "onboarded_at": "2026-05-16T10:15:10Z"
}
// 200 -> updated user object
```

---

## Canonical endpoint map

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

## Canonical examples

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

---

## Errors

| Status | Body                                    |
| ------ | --------------------------------------- |
| 400    | `{ "image": ["Image exceeds 8 MB ..."] }` |
| 401    | `{ "detail": "Authentication credentials were not provided." }` |
| 404    | `{ "detail": "Not found." }`            |

---

## One-click local launch (Windows)

If you use the desktop shortcuts created for this repository:

- Start: runs backend + frontend and opens `http://localhost:3000`
- Stop: frees ports `8000` and `3000`

Scripts are in:

- `scripts/launch_astrovision_localhost.ps1`
- `scripts/stop_astrovision_localhost.ps1`
