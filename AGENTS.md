# AGENTS.md

Guidance for AI coding agents working in this repository.

> **This project is being rewritten from scratch.** This document describes what
> UraBot *should be* — its purpose and behavioral contract — not the current
> implementation. Do not preserve quirks of the legacy code; treat this as the
> north-star for the new build.

## What UraBot is

UraBot is a bot that posts about the uranium market. On a schedule it:

1. Fetches uranium-related **stock quotes** and **news**.
2. Formats them into a human-readable message, optionally with an LLM-generated comment.
3. Broadcasts that message to social platforms (X, Nostr, and any future targets).

It is a small, single-purpose service. Keep it simple.

## Behavioral contract

These are the requirements the rewrite must satisfy. *How* they're met is open.

- **Triggered, not self-scheduling.** Posting is kicked off externally (e.g. a cron
  caller). The service exposes actions to "post stocks" and "post news"; it does not
  own its own timer.
- **Two post types:** a stock-quote roundup and a news post.
- **Resilient fan-out.** A message goes to every configured social target. One
  platform failing must not prevent the others from posting.
- **Pluggable targets.** Adding or removing a social platform should be a localized
  change — define a common posting interface and register implementations.
- **Time/context-aware messaging.** Message wording can vary by context (e.g. market
  hours, first post of the day, holidays, market timezone).
- **Configurable, fail-fast config.** Secrets come from the environment and are
  validated at startup; non-sensitive defaults live in code (`src/config.ts`).
- **Authenticated entry points.** Externally-triggered actions require authentication;
  health checks do not.
- **Observable health.** Expose a lightweight health/heartbeat signal for monitoring.

## Principles for the rewrite

- One integration per concern — no parallel "legacy + new" clients living side by side.
- Prefer real, simple persistence (or none) over dead stubs that pretend to cache.
- Fail-soft on outbound posting, fail-fast on misconfiguration.
- Keep the surface area small; this is a bot, not a platform.

## External dependencies (capabilities, not commitments)

The product needs, conceptually:

- A **market data** source for uranium-related stock quotes and news.
- An **LLM** to optionally generate commentary in the bot's voice.
- **Social platform** APIs to publish to (X, Nostr, …).

Specific providers and SDKs are an implementation choice for the rewrite.

## Build and run

```bash
# Install dependencies
npm install

# Type-check without emitting
npm run typecheck      # or: make typecheck

# Development server (hot-reload)
npm run dev            # or: make dev

# Production build
npm run build          # or: make build

# Run built output
npm run start          # or: make start
```

## Forbidden patterns

- Do **not** use `Promise.all` for fan-out — use `Promise.allSettled`.
- Do **not** silently default missing env vars to `""` or `undefined` — throw at startup.
- Do **not** add two clients for the same platform (e.g. both OAuth 1.0a and 2.0 for X).
- Do **not** add a route without a corresponding entry in `docs/API.md`.
- Do **not** add an env var for non-secret defaults (port, version, public API URLs, model slugs).
- Do **not** add a **secret** env var without `docs/CONFIGURATION.md` and `.env.example`.
- Do **not** hardcode a static holiday list — fetch from market-data API, fallback to config.
- Do **not** use exact-minute clock checks for post context — use a time window or explicit param.

## Key reference docs

| File | What it covers |
|---|---|
| `docs/API.md` | HTTP routes and auth contract |
| `docs/CONFIGURATION.md` | All environment variables |
| `docs/DOMAIN.md` | Stocks, schedule, message format, LLM persona |
| `docs/agents/ARCHITECTURE.md` | Layer responsibilities, ISocialService interface |
| `docs/agents/ANTI-PATTERNS.md` | Known gaps and open decisions |
| `docs/3rd-parties/` | Integration notes per external provider |

## Definition of Done

Before declaring any task complete:

- [ ] All affected `docs/` files updated in the same commit
- [ ] `.env.example` has a key (no value) for every new **secret** env var
- [ ] No new route without an entry in `docs/API.md`
- [ ] Fan-out uses `Promise.allSettled`
- [ ] Every required env var throws at startup if missing
- [ ] No two clients for the same social platform
