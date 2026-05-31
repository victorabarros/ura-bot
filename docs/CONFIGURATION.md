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

### Legacy Twitter client (OAuth 1.0a — to be removed)

| Variable | Required | Description |
|---|---|---|
| `URA_BOT_TWITTER_API_KEY` | **Yes** | App consumer key |
| `URA_BOT_TWITTER_API_KEY_SECRET` | **Yes** | App consumer secret |
| `URA_BOT_TWITTER_ACCESS_TOKEN` | **Yes** | Account access token |
| `URA_BOT_TWITTER_ACCESS_TOKEN_SECRET` | **Yes** | Account access token secret |

### XSocial client (OAuth 2.0 PKCE — keep this one)

| Variable | Required | Description |
|---|---|---|
| `URA_BOT_X_CLIENT_ID` | **Yes** | OAuth 2.0 app client ID from developer.x.com |
| `URA_BOT_X_CLIENT_SECRET` | **Yes** | OAuth 2.0 app client secret |
| `URA_BOT_X_ACCESS_TOKEN` | **Yes** | Initial access token (refreshed automatically at runtime) |
| `URA_BOT_X_REFRESH_TOKEN` | **Yes** | Refresh token used to obtain new access tokens |

See `docs/3rd-parties/twitter-x-dot-com.md` for OAuth flow details.

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

## Redis (cache)

Used to persist the X OAuth access token between requests so the token is not
re-fetched on every post.

| Variable | Required | Description |
|---|---|---|
| `REDIS_CLOUD_HOST` | **Yes** | Redis hostname |
| `REDIS_CLOUD_PORT` | **Yes** | Redis port |
| `REDIS_CLOUD_USERNAME` | **Yes** | Redis ACL username |
| `REDIS_CLOUD_PASSWORD` | **Yes** | Redis ACL password |

> **Note:** The current `CacheRepository` implementation is a stub (get always
> returns `null`, set is a no-op). The rewrite must provide a real Redis
> connection or drop the dependency.
