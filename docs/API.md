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

One endpoint is **exempt** from this check:

| Group | Endpoint |
|---|---|
| Health / monitoring | `GET /heartbeat` |

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
{ "created_at": "<ISO-8601 timestamp>", "tweet_id": "<X post id>" }
```

When the roundup is split into multiple X posts (chunked tickers), successful ids
are returned as an array:

```json
{ "created_at": "<ISO-8601 timestamp>", "tweet_ids": ["<id>", "..."] }
```

`tweet_id` / `tweet_ids` are omitted when X posting did not succeed.

**Response `500 Internal Server Error`** – no quotes could be retrieved.

---

### `POST /urabot/news`

Picks a recent uranium-related news item at random, generates an LLM comment,
and broadcasts it to all configured social platforms.

**Auth:** API key required.

**Response `200 OK`**

```json
{ "created_at": "<ISO-8601 timestamp>", "tweet_id": "<X post id>" }
```

`tweet_id` is omitted when X posting did not succeed.

**Response `204 No Content`** – no news articles were found.

**Response `500 Internal Server Error`** – unexpected error during broadcast.

---

## X credentials

UraBot is a headless server-side bot — there is no interactive OAuth flow.
The initial `access_token` and `refresh_token` for X are obtained manually from
the [X developer portal](https://developer.x.com) and injected as environment
variables (`URA_BOT_X_ACCESS_TOKEN`, `URA_BOT_X_REFRESH_TOKEN`). See
`docs/CONFIGURATION.md` for the full variable list.

Token rotation is handled automatically: when the access token expires (`401`),
`XService` exchanges the refresh token for a new pair and persists both to Redis
so subsequent requests use the fresh tokens without requiring a restart.

---

## Deprecated routes

| Route | Replacement |
|---|---|
| `POST /tweet` | `POST /urabot/stocks` |

Deprecated routes should be removed in the rewrite; do not add new callers.
