# Third-party integrations

How UraBot must talk to external services. These docs describe **intent and the
content/format exchanged** — *what* we ask for and *what* we get back — not code,
SDKs, or library choices. Those are decisions for the rewrite.

## The integrations

| Doc | Role | Direction | Purpose |
|-----|------|-----------|---------|
| [finhub.md](./finhub.md) | Market data | **in** | Real-time stock quotes + company news for tracked uranium tickers. |
| [replicate-ai.md](./replicate-ai.md) | LLM | **in** | Generates the bot's commentary in the UraBot voice. |
| [twitter-x-dot-com.md](./twitter-x-dot-com.md) | Social | **out** | Publishes posts to X. |
| [nostr.md](./nostr.md) | Social | **out** | Publishes notes to Nostr relays. |

> **Market holidays** are currently *not* a third party — they live as a hardcoded
> table in the codebase (US exchange, `America/New_York`, per-date trading hours and
> optional custom messages). It is a candidate to externalize to a calendar/market
> data provider later. See the note at the bottom of this file for the data shape.

## Shared contracts

### Outbound posting (all social targets)

Every social target implements the **same** minimal contract so the bot can fan a
single message out to all of them uniformly:

- **Input:** one plain-text message (already composed and trimmed; non-empty).
- **Output:** an identifier for the created post (`{ id }`).
- **Fan-out is resilient:** one target failing must not stop the others. The result
  per target is independent success/failure.

This uniformity is the whole point — adding a new platform = implementing this one
contract and registering it. Do not let platform-specific concerns (char limits,
auth refresh) leak into the bot's core logic; keep them inside each integration.

### Inbound data (market data, LLM)

- **Configurable & fail-fast:** every integration's credentials/endpoints come from
  the environment and are validated at startup — missing required config fails loudly.
- **Each integration owns its own auth.** The bot core should not know whether a
  target uses an API token, OAuth, or a signing key.

---

## Appendix — market holiday data shape (currently internal)

A list of holiday entries plus exchange metadata:

- **Exchange:** `US`  **Timezone:** `America/New_York`
- **Per entry:**
  - `eventName` — e.g. "Thanksgiving Day", "Independence Day"
  - `atDate` — `YYYY-MM-DD`
  - `tradingHour` — `""` for a full close, or a `HH:MM-HH:MM` window for an early close
  - `message` *(optional)* — a custom celebratory message; otherwise default to
    `Today is <eventName>`

Behavior: a date with empty `tradingHour` is a full holiday; with a window, it's only
"holiday" outside that window.
