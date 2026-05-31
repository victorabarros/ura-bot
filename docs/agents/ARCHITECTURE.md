# Architecture

This document describes the intended architecture for UraBot. It is written as
a north-star for the rewrite, not a description of the legacy code.

---

## Overview

UraBot is a single HTTP service. An external scheduler calls it; it does work
and fans out to social platforms. No state is owned by the service itself
beyond token caching.

```
[Cron / external trigger]
        │
        ▼
  ┌─────────────┐
  │  HTTP layer │  (Express / equiv.)
  │  + auth MW  │
  └──────┬──────┘
         │
  ┌──────▼──────┐
  │ Controllers │  postStocks / postNews
  └──────┬──────┘
         │
   ┌─────┴──────┐
   │            │
   ▼            ▼
[Market data] [LLM]        ← fetch/generate content
 (Finnhub)  (Replicate)
         │
         ▼
  ┌──────────────┐
  │  Fan-out to  │
  │social targets│  one goroutine / promise per target
  └──┬───┬───┬──┘
     │   │   │
     ▼   ▼   ▼
    X  Nostr  (future)
```

---

## Layer responsibilities

### HTTP layer

- Parses and routes requests.
- Runs the authentication middleware on every route except `/heartbeat` and
  `/callback`.
- Does not contain business logic.

### Controllers

Two actions: `postStocks` and `postNews`. Each:

1. Determines context (time, holiday status).
2. Fetches data (quotes or news).
3. Formats one or more messages.
4. Hands off to the fan-out layer.

### Social platform interface

Every target implements a single interface:

```ts
interface ISocialService {
  postMessage(message: string): Promise<{ id: string }>
}
```

Failures from one target must not prevent others from posting (fan-out is
`Promise.allSettled` or equivalent, not `Promise.all`).

### Market data service

Wraps Finnhub. Provides:
- `getQuote(ticker: string)` — real-time price + open price
- `searchNews(ticker: string)` — recent news for a ticker

### LLM service

Wraps Replicate. Provides:
- `generateComment(prompt: string, persona: Persona)` — returns a short text

### Cache

Used only to persist the X OAuth 2.0 access token across requests, avoiding
a token refresh on every post. Key: `access_token`, TTL: 1 hour.

Backed by Redis. Must be a real implementation in the rewrite (the legacy
`CacheRepository` is a stub).

---

## OAuth callback flow (X)

The `/callback` endpoint is an OAuth 2.0 PKCE redirect URI. It is called by
X's authorization server after the user (bot account owner) approves access.
The handler exchanges the auth code for access + refresh tokens and persists
them (environment or cache). This is a one-time setup flow, not part of
the normal posting loop.

---

## Configuration

All secrets and settings come from environment variables validated at startup.
See `docs/CONFIGURATION.md`.
