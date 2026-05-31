# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

UraBot is a stateless HTTP server (Node/TypeScript + Express) that, when its POST
endpoints are hit, fetches uranium-related stock quotes / news, formats a message
(optionally commented by an LLM), and broadcasts it to social platforms
(Twitter, X, Nostr). It does **not** schedule itself — an external cron service
(cron-job.org) calls the endpoints on a schedule. There is no database; persistence
is effectively disabled (see "Gotchas").

## Commands

Everything is meant to run inside Docker via the `Makefile` (the host needs only
Docker + make). All targets read env vars from an `.env` file (`.env.test` for tests);
copy `.env.example` and fill it in. `config.ts` throws at startup for most missing vars.

```sh
make debug-server        # run with hot reload (yarn dev) on PORT 8082
make test-server         # run tests against .env.test, then open coverage/index.html
make build-server-image  # yarn install + yarn build (compile to dist/)
make run-server          # yarn start (runs compiled dist/)

# hit the local server (API_KEY defaults to "McChickenPromo" in the Makefile)
make curl-heart          # GET /heartbeat
make curl-ura-stocks     # POST /urabot/stocks  (sends Authorization header)
make curl-ura-news       # POST /urabot/news
# ...-prod variants hit https://api.uraniumstockbot.com/
```

Direct yarn scripts (if running outside Docker): `yarn dev`, `yarn build`, `yarn lint`,
`yarn start`. `prebuild` wipes `dist/`; `preinstall` wipes `node_modules/`.

### Tests — important

- Jest's `roots` is `./dist/test/`, so **tests run against compiled JS, not `.ts` source**.
  You must `yarn build` before testing. `make test-server` does this implicitly
  (`pretest` runs `yarn lint && yarn build`).
- There is currently **no `test` script in `package.json`**, yet `make test-server`
  invokes `yarn test`. This is a known gap (see `TODO.md`); add the script or run jest
  directly. Run a single test file after building, e.g.:
  `npx jest dist/test/unit/services/Holiday.test.js`
- The deploy build (`nixpacks.toml`) intentionally has **no test phase** — tests are not
  gated on deploy.

## Deployment

Deployed on Railway via `nixpacks.toml` (setup → `yarn install --frozen-lockfile` →
`yarn build` → `./start.sh`). Note `start.sh` is the prod entrypoint (not the `yarn start`
script). Uptime Kuma pings `/heartbeat` for monitoring.

## Architecture

Request flow:

```
cron-job.org → Express (index.ts)
             → middleware.ts        (API-key auth via Authorization header;
                                      bypassed for /heartbeat and /callback)
             → routes.ts            (POST /urabot/stocks, /urabot/news, GET /heartbeat)
             → controller/Uranium.ts (orchestration)
             → services/*           (data in, posts out)
```

The controller is the brain. `postUraStock` / `postUraNews` pull data, build the message
in `controller/helper.ts`, then call the private `postMessage()` which **fans out the same
message to every social service** and awaits them with `Promise.all`.

### Services (`src/services`)

All instances are constructed once as singletons in `src/services/index.ts` and imported
from there.

- **Data in:**
  - `Finnhub.ts` — real-time stock quotes (`getQuoteRealTime`) and news (`searchNews`).
  - `Holidays.ts` — US market holiday detection for special messages.
  - `ReplicateAI.ts` — wraps Replicate; `GetAnswer(prompt, persona)` generates the AI
    comment for news posts. The bot's voice lives in the `URABOT` persona's system prompt.
- **Posts out** — all implement `ISocialService.postMessage(message): Promise<{id}>`:
  - `Nostr.ts` — posts to Nostr relays.
  - `Twitter.ts` — **legacy**, X API v1.1 via OAuth1 using the deprecated `request` lib.
    Fire-and-forget: it does not await the HTTP call and returns `{ id: "TODO" }`. Its own
    code comment says to migrate to `twitter-api-v2`.
  - `XSocial/` — current X API **v2** client via raw `axios` + OAuth2. Hand-rolls bearer
    auth and a `withRefreshedTokenRetry` that refreshes the token on a 401 and retries once.

To add or change a posting target, implement `ISocialService` and wire it in
`services/index.ts` + the fan-out in `controller/Uranium.ts:postMessage`.

### Message composition

`controller/helper.ts` is **time-zone aware (America/New_York) and time-gated**: the
greeting, evening sign-off, and "first post of day" logic key off specific clock times
(`isFirstPostOfDay` = 14:00, evening = 21:00). Behavior therefore depends on when the cron
job fires. Stock messages are chunked to `MAX_STOCKS_PER_MESSAGE` (6) to stay under X's
character limit; the tracked tickers are the `STOCKS` array in `controller/Uranium.ts`.

### Config

`src/config.ts` is the single typed source of env config; it throws on missing required
vars at import time. Note there are **two distinct X/Twitter credential sets**:
`URA_BOT_TWITTER_*` (OAuth1, for `Twitter.ts`) and `URA_BOT_X_*` (OAuth2, for `XSocial/`).

## Gotchas / known debt (see `TODO.md`)

- **No persistence.** `repositories/cache` (`CacheRepository`) is a **no-op stub**:
  `get` always returns `null`, `set` does nothing. The controller's X access-token caching
  (`cacheRepository.get/set("access_token")`) is therefore effectively dead — every X path
  behaves as a cache miss. The Postgres DB and migrations under `repositories/migrations`
  are deprecated and unused (see `repositories/README.md`).
- **Two competing X integrations** (`Twitter.ts` and `XSocial/`) both run in the fan-out.
  When reworking X posting, reconcile these rather than adding a third.
- `XSocialService` requires an `onRefreshToken` callback in its props/type, but
  `services/index.ts` constructs it without one — calling the refresh path will throw.
- The fan-out uses `Promise.all`, so one failing platform fails the whole request
  (TODO notes switching to `Promise.allSettled`).
- `src/midleware.ts` is misspelled on purpose (imports rely on it); don't "fix" the name
  without updating imports.

## API testing collections

`zarf/bruno/` (Bruno) and `zarf/*.postman_collection.json` hold ready-made requests for
UraBot, Finnhub, and the X API — useful for poking endpoints by hand.
