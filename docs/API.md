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
| Health / monitoring | `GET /heartbeat`, `GET /healthcheck` |
| Public read | `GET /urabot/latest-post` |

---

## Endpoints

### `GET /heartbeat`

Lightweight liveness probe. No authentication required.

**Response `200 OK`**

```json
{ "success": true, "version": "<semver>" }
```

---

### `GET /healthcheck`

Readiness probe: calls Finnhub, Replicate, and X with lightweight requests (no
posting). No authentication required.

**Response `200 OK`** — all dependencies reachable.

```json
{
  "success": true,
  "version": "<semver>",
  "dependencies": {
    "finnhub": { "ok": true },
    "replicate": { "ok": true },
    "x": { "ok": true }
  }
}
```

**Response `503 Service Unavailable`** — one or more dependencies failed.

```json
{
  "success": false,
  "version": "<semver>",
  "dependencies": {
    "finnhub": { "ok": true },
    "replicate": { "ok": false, "error": "<message>" },
    "x": { "ok": true }
  }
}
```

Failures are logged server-side with integration name and API detail when available.

---

### `GET /urabot/latest-post`

Returns the bot's most recent original post from X (excludes retweets and replies).
No authentication required.

**Response `200 OK`**

```json
{
  "id": "1234567890123456789",
  "text": "CCJ     45.23 +1.25% 📈\n...\n#Uranium☢️",
  "createdAt": "2026-06-08T22:05:00.000Z",
  "url": "https://x.com/ura_bot/status/1234567890123456789"
}
```

**Response `503 Service Unavailable`** — X API unreachable or no posts found.

```json
{ "error": "<message>", "integration": "x" }
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

`tweet_id` / `tweet_ids` are omitted when X posting did not succeed but another
target succeeded. If **every** social target fails, the response is `502` (see below).

**Response `500 Internal Server Error`** – no quotes could be retrieved after partial
upstream success.

**Response `502 Bad Gateway`** – all configured social platforms failed to publish.

**Response `503 Service Unavailable`** – Finnhub rate-limited or quote API unavailable.

Error bodies: `{ "error": "<message>", "integration": "finnhub" | "social" }`.

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

**Response `204 No Content`** – Finnhub returned successfully but no articles were
found in the 7/30-day lookback windows.

**Response `502 Bad Gateway`** – all configured social platforms failed to publish.

**Response `503 Service Unavailable`** – Finnhub rate-limited / unavailable, or
Replicate comment generation failed.

**Response `500 Internal Server Error`** – unexpected internal error.

Error bodies: `{ "error": "<message>", "integration": "finnhub" | "replicate" | "social" | "internal" }`.

---

### `POST /urabot/top-trending`

Searches recent uranium-related tweets on X, picks the highest-engagement one,
generates an LLM reaction comment in the UraBot voice, and **quote-tweets** the
original post with that comment.

Uses the query `(uranium OR $UEC OR $CCJ OR $URA OR $URNM) -is:retweet lang:en`
sorted by relevancy. Requires at minimum the **Basic** X API access tier.

**Auth:** API key required.

**Response `200 OK`**

```json
{
  "created_at": "<ISO-8601 timestamp>",
  "tweet_id": "<id of the new quote tweet>",
  "quoted_tweet_id": "<id of the original tweet that was quoted>"
}
```

**Response `204 No Content`** – X search returned no tweets.

**Response `503 Service Unavailable`** – X tweet search failed, X quote tweet
failed, or Replicate comment generation failed.

**Response `500 Internal Server Error`** – unexpected internal error.

Error bodies: `{ "error": "<message>", "integration": "x" | "replicate" | "internal" }`.

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
