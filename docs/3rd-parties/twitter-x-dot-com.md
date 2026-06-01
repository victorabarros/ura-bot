# X (x.com / Twitter) — social posting (outbound)

Docs: https://docs.x.com/

## Why we integrate

To publish UraBot's posts to X. This is one implementation of the shared
[outbound posting contract](./README.md#outbound-posting-all-social-targets).

> **Legacy warning — do not recreate.** The old code carried *two* X integrations at
> once: a v1.1 / OAuth1 client that was fire-and-forget (never awaited, returned a
> fake id) **and** a v2 / OAuth2 client. The rewrite must have **exactly one** X
> integration. Choose **X API v2 with OAuth2**.

## Content / format

- **Input:** one plain-text post.
  - Trimmed; **must be non-empty** (reject empty).
  - **Must fit X's character limit** — the bot chunks long content upstream, but the
    integration should still guard the limit.
- **Output:** the created post's **id**.

## Authentication

OAuth2 (user context) with **access token + refresh token**:

- Requests authenticate with a bearer access token.
- On an **expired/unauthorized (401)** response: refresh the access token using the
  refresh token + client credentials, then **retry once**.
- **Persist the refreshed tokens.** This is critical: in the legacy system token
  persistence was a no-op stub, so every run started cold and the refresh path was
  effectively broken. The rewrite must durably store the rotated access/refresh
  tokens after a refresh.

## Requirements for the rewrite

- Single retry on auth failure — do not loop.
- Surface real success/failure (no fake/placeholder ids) so the fan-out can report
  per-platform results.
- Keep char-limit and auth-refresh concerns **inside** this integration.
