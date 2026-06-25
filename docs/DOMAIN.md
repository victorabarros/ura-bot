# Domain Knowledge

This document captures the business rules embedded in the codebase that must
survive the rewrite even though the code itself will be replaced.

---

## Tracked stocks

All prices are fetched from Finnhub. The list is split by exchange for
reference but treated as a single flat list at runtime.

### NYSE / US exchanges

| Ticker | Company |
|---|---|
| `CCJ` | Cameco — second-largest uranium producer in the world |
| `DNN` | Denison Mines |
| `NXE` | NexGen Energy |
| `SMR` | NuScale Power Corporation |
| `SRUUF` | Sprott Physical Uranium Trust |
| `UEC` | Uranium Energy Corp |
| `URA` | Global X Uranium ETF (~23% Cameco, ~20% Kazatomprom) |
| `URNM` | Sprott Uranium Miners ETF |
| `UUUU` | Energy Fuels |

### Other

| Ticker | Company |
|---|---|
| `URNJ` | Sprott Junior Uranium Miners ETF |
| `UROY` | Uranium Royalty Corp |

> The rewrite may source this list from config/environment rather than
> hardcoding it, but the tickers above are the canonical set.

### Per-message stock limit

Each social post holds a maximum of **6 stock quotes** to stay within
character limits (especially X/Twitter). If more quotes are fetched, they are
split into multiple sequential messages.

---

## Post schedule & time context

The service does not own its own scheduler — an external cron caller triggers
`POST /urabot/stocks` and `POST /urabot/news`. The message wording varies
depending on *when* the request arrives.

All time logic uses **`America/New_York`** as the market timezone.

| Condition | Rule |
|---|---|
| First post of the day | Triggers when the call arrives at exactly **14:00 UTC** (≈ 09:00–10:00 ET, before NYSE open). Adds a "Good morning" greeting. |
| Last post of the day | Triggers when the call arrives at exactly **21:00 UTC** (≈ 16:00–17:00 ET, after NYSE close). Adds a "Good night" sign-off. |
| Friday close | The "Good Night" message also includes a weekend greeting on Fridays. |
| Holiday (market closed) | See the Holiday behavior section below. |

> These times are tight equality checks (`hours === 14 && minutes === 0`), so
> the cron *must* fire at exactly those minutes. The rewrite should consider
> a time-window approach to be more resilient.

---

## Holiday behavior

On NYSE market holidays the stock-post flow is short-circuited: instead of
fetching quotes, a holiday message is posted.

The holiday list is currently hardcoded in the service for 2024–2026. The
rewrite should prefer fetching this from a market-data API (Finnhub provides
market holiday data) and falling back to a hardcoded list.

**Holidays observed (NYSE schedule):**

- New Year's Day
- Birthday of Martin Luther King, Jr.
- Washington's Birthday (Presidents' Day)
- Good Friday
- Memorial Day
- Juneteenth
- Independence Day — has a custom message: *"Today is Independence Day 🎇🎇🎇 / Celebrate with your family and friends / And always remember FREEDOM IS NOT FREE!"*
- Labor Day
- Thanksgiving Day (full day + day-after early close 09:30–13:00)
- Christmas Eve (early close 09:30–13:00)
- Christmas Day

**Logic:** A day counts as a holiday if the market is fully closed (`tradingHour = ""`). On early-close days the session is considered a holiday only during the shortened trading window.

---

## Message format — stocks post

```
Good Morning, everyone!          ← only on first post of the day

$CCJ    22.50 +1.23% 📈
$DNN     1.83 -0.54% 📉
...

HH:MM America/New_York
#Uranium☢️

Good Night, folks! Have a nice and sunny weekend   ← only at close / Friday
See ya
```

- Ticker column is left-padded to 6 characters.
- Delta is `(price - openPrice) / openPrice * 100`, shown to 2 decimal places.
- Positive delta → `📈`, negative → `📉`.
- Signature includes the current time in `HH:MM` (24h) in the NY timezone.

---

## Message format — news post

```
Uranium watch: <plain headline, max ~80 chars>

<LLM takeaway, max ~100 chars>

#Uranium☢️
```

- The headline is taken verbatim from the Finnhub article (no Unicode styling).
  Whitespace is collapsed and the text is truncated to ~80 chars with `...` when needed.
- The LLM takeaway is also collapsed and truncated to ~100 chars with `...`.
- The article is selected randomly from recent news for a randomly selected ticker
  in the stocks list.

---

## LLM persona (Replicate / Llama)

**Model:** `meta/meta-llama-3-70b-instruct` on Replicate (`REPLICATE_MODEL` in `src/config.ts`;
legacy `meta/meta-llama-3.1-405b-instruct` was retired by the provider)

**Base persona (`BASE_PERSONA` in `src/services/replicate.ts`):**
> You are a uranium market analyst with a sharp, precise voice and dry wit.
> You write with authority — no hedging, no filler, no clichés. One punchy observation per post.
> You cover uranium and nuclear energy from every angle: supply/demand, geopolitics, capital markets,
> energy policy, technology, and investor psychology. Rotate across these angles; never fixate on
> one political frame.
> Never use hashtags or external links.
> Never give investment recommendations, financial advice, or suggest buying or selling any asset.

**Rotating angle injection:** For each `generateComment` call, one angle from `COMMENT_ANGLES` is
randomly appended to the system prompt so consecutive posts vary in framing. Angles include:
supply/demand fundamentals, geopolitics, energy transition, capital markets, utility contracting
cycles, market psychology, and technology/fuel cycle.

**Generation params:** `temperature=0.6`, `top_k=50`, `top_p=0.9`,
`max_tokens=1024`.

**User prompt template for news posts:**
> Write one concrete uranium-market takeaway in 100 characters or less. No hashtags, no links,
> no incomplete sentence. News: `<JSON news object>`

The news object from Finnhub includes `headline`, `summary`, `url`, and
`datetime` fields.
