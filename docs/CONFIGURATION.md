# Configuration

All configuration comes from environment variables. The service validates every
required variable at startup and throws immediately if one is missing — there is
no graceful degradation for misconfiguration.

---

## Server

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `8082` | HTTP port the server listens on |
| `API_KEY` | **Yes** | — | Static bearer token used to authenticate inbound requests (see `docs/API.md`) |
| `VERSION` | No | `1.11.0` | Semver string returned by the `/heartbeat` endpoint |

---

## Finnhub (market data)

| Variable | Required | Default | Description |
|---|---|---|---|
| `FINNHUB_API_KEY` | **Yes** | — | API key from [finnhub.io](https://finnhub.io) |
| `FINNHUB_ADDRESS` | No | `https://finnhub.io/api/v1/` | Base URL for the Finnhub REST API; override for testing |

See `docs/3rd-parties/finhub.md` for endpoint details.

---

## X / Twitter (social platform)

Two separate X integrations exist in the current codebase. They should be
consolidated to a single OAuth 2.0 PKCE client (the `XSocial` one) in the
rewrite.

All four values are available directly on the **"Keys and Tokens"** tab of your app in
[developer.x.com](https://developer.x.com). Tokens do not expire.

| Variable | Required | Where to find it |
|---|---|---|
| `URA_BOT_X_CONSUMER_KEY` | **Yes** | "API Key" under "Consumer Keys" |
| `URA_BOT_X_CONSUMER_KEY_SECRET` | **Yes** | "API Key Secret" under "Consumer Keys" |
| `URA_BOT_X_ACCESS_TOKEN` | **Yes** | "Access Token" under "Authentication Tokens" (click Generate) |
| `URA_BOT_X_ACCESS_TOKEN_SECRET` | **Yes** | "Access Token Secret" under "Authentication Tokens" |

See `docs/3rd-parties/twitter-x-dot-com.md` for integration details.

---

## Nostr (social platform)

| Variable | Required | Default | Description |
|---|---|---|---|
| `URA_BOT_NOSTR_SECRET_KEY` | **Yes** | — | Hex-encoded Nostr private key for the bot account |
| `NOSTR_RELAY_URLS` | No | See below | Comma-separated list of WebSocket relay URLs |

Default relays:
```
wss://nostr.bitcoiner.social
wss://nostr-pub.wellorder.net
wss://nostr.mom
wss://nos.lol
wss://relay.mostr.pub
wss://relay.damus.io
```

See `docs/3rd-parties/nostr.md` for protocol details.

---

## Replicate AI (LLM)

| Variable | Required | Description |
|---|---|---|
| `REPLICATE_API_TOKEN` | **Yes** | API token from [replicate.com](https://replicate.com) |

Model used: `meta/meta-llama-3.1-405b-instruct`

See `docs/3rd-parties/replicate-ai.md` for usage details.

---

