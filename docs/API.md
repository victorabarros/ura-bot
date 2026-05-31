# API Reference

This document is the canonical contract for UraBot's HTTP surface. All route
paths, methods, and authentication requirements must stay consistent across
implementations and refactors.

---

## Authentication

Most endpoints require a static API key passed in the `Authorization` header.

```
Authorization: <API_KEY>
```

If the key is missing or wrong the server returns `401 Unauthorized`.

Two endpoint groups are **exempt** from this check:

| Group | Endpoints |
|---|---|
| Health / monitoring | `GET /heartbeat` |
| OAuth callbacks | `GET /callback` |

---

## Endpoints

### `GET /heartbeat`

Lightweight liveness probe. No authentication required.

**Response `200 OK`**

```json
{ "success": true, "version": "<semver>" }
```

---

### `POST /urabot/stocks`

Fetches real-time uranium stock quotes and broadcasts a formatted message to
all configured social platforms.

**Auth:** API key required.

**Response `200 OK`**

```json
{ "created_at": "<ISO-8601 timestamp>" }
```

**Response `500 Internal Server Error`** – no quotes could be retrieved.

---

### `POST /urabot/news`

Picks a recent uranium-related news item at random, generates an LLM comment,
and broadcasts it to all configured social platforms.

**Auth:** API key required.

**Response `200 OK`**

```json
{ "created_at": "<ISO-8601 timestamp>" }
```

**Response `204 No Content`** – no news articles were found.

**Response `500 Internal Server Error`** – unexpected error during broadcast.

---

### `GET /callback`

OAuth redirect target used by social platform authorization flows (e.g. X /
Twitter OAuth 2.0 PKCE). No authentication required — the platform drives the
request.

Query parameters and response shape are provider-specific and handled
internally.

---

## Deprecated routes

| Route | Replacement |
|---|---|
| `POST /tweet` | `POST /urabot/stocks` |

Deprecated routes should be removed in the rewrite; do not add new callers.
