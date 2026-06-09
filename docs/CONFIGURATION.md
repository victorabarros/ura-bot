# Configuration

**Secrets** come from environment variables. The service validates every required
secret at startup and throws immediately if one is missing.

**Non-secret defaults** (port, version, API base URLs, Replicate model slug) live in
`src/config.ts` — not in env. See `.cursor/rules/environment-secrets-only.mdc`.

---

## Server

| Variable | Required | Description |
|---|---|---|
| `API_KEY` | **Yes** | Static bearer token for inbound requests (see `docs/API.md`) |

| Setting (in code) | Value | Description |
|---|---|---|
| `SERVER_PORT` | `8082` | HTTP listen port (`src/config.ts`) |
| `SERVER_VERSION` | `2.0.0` | Semver returned by `GET /heartbeat` |

---

## Finnhub (market data)

| Variable | Required | Description |
|---|---|---|
| `FINNHUB_API_KEY` | **Yes** | API key from [finnhub.io](https://finnhub.io) |

| Setting (in code) | Value |
|---|---|
| `FINNHUB_BASE_URL` | `https://finnhub.io/api/v1/` |

See `docs/3rd-parties/finhub.md` for endpoint details.

---

## X / Twitter (social platform)

All four values are on the **"Keys and Tokens"** tab of your app in
[developer.x.com](https://developer.x.com).

| Variable | Required | Where to find it |
|---|---|---|
| `URA_BOT_X_CONSUMER_KEY` | **Yes** | "API Key" under "Consumer Keys" |
| `URA_BOT_X_CONSUMER_KEY_SECRET` | **Yes** | "API Key Secret" under "Consumer Keys" |
| `URA_BOT_X_ACCESS_TOKEN` | **Yes** | "Access Token" under "Authentication Tokens" |
| `URA_BOT_X_ACCESS_TOKEN_SECRET` | **Yes** | "Access Token Secret" under "Authentication Tokens" |

See `docs/3rd-parties/twitter-x-dot-com.md`.

---

## BitcoinMetrx X / Twitter (social platform)

Credentials for the `bitcoinmetrx` X account — used by `POST /bitcoinmetrx/price`.
All four values are on the **"Keys and Tokens"** tab of the app in
[developer.x.com](https://developer.x.com).

| Variable | Required | Where to find it |
|---|---|---|
| `BITCOINMETRX_X_CONSUMER_KEY` | **Yes** | "API Key" under "Consumer Keys" |
| `BITCOINMETRX_X_CONSUMER_KEY_SECRET` | **Yes** | "API Key Secret" under "Consumer Keys" |
| `BITCOINMETRX_X_ACCESS_TOKEN` | **Yes** | "Access Token" under "Authentication Tokens" |
| `BITCOINMETRX_X_ACCESS_TOKEN_SECRET` | **Yes** | "Access Token Secret" under "Authentication Tokens" |

See `docs/3rd-parties/twitter-x-dot-com.md`.

---

## Replicate AI (LLM)

| Variable | Required | Description |
|---|---|---|
| `REPLICATE_API_TOKEN` | **Yes** | API token from [replicate.com](https://replicate.com) |

| Setting (in code) | Value |
|---|---|
| `REPLICATE_MODEL` | `meta/meta-llama-3-70b-instruct` (change in `src/config.ts` to try e.g. `openai/gpt-4o-mini`) |

See `docs/3rd-parties/replicate-ai.md`.

---

## Production

Do not commit `.env` with real secrets. Use the host's secret manager in production.
