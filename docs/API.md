# API Reference

Base URL: `http://localhost:8000/api`

All `/predictions/*` endpoints require a JWT in the `Authorization: Bearer <token>` header.

## Auth

### `POST /auth/register/`

```json
// request
{ "email": "alice@example.com", "password": "Sup3rStrong!" }
// 201
{ "id": 1, "email": "alice@example.com" }
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
{ "id": 1, "email": "alice@example.com", "date_joined": "2026-04-23T10:00:00Z" }
```

---

## Predictions

### `POST /predictions/`  (multipart)

| field | type | notes                          |
| ----- | ---- | ------------------------------ |
| image | file | JPEG or PNG, ≤ 8 MB            |

```json
// 201
{
  "id": 17,
  "image": "/media/uploads/user_1/galaxy.png",
  "predicted_class": "Spiral",
  "confidence": 0.91,
  "probabilities": {
    "Spiral": 0.91, "Elliptical": 0.05,
    "Irregular": 0.03, "Lenticular": 0.01
  },
  "created_at": "2026-04-23T10:30:00Z"
}
```

### `GET /predictions/`

Paginated list of the **current user's** predictions.

```json
{
  "count": 1, "next": null, "previous": null,
  "results": [ /* Prediction */ ]
}
```

### `GET /predictions/{id}/`

Returns a single prediction. 404 if it isn't owned by the requester.

### `DELETE /predictions/{id}/`

Deletes a prediction. 204 on success.

---

## Errors

| Status | Body                                    |
| ------ | --------------------------------------- |
| 400    | `{ "image": ["Image exceeds 8 MB ..."] }` |
| 401    | `{ "detail": "Authentication credentials were not provided." }` |
| 404    | `{ "detail": "Not found." }`            |
