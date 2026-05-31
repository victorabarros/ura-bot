# Finnhub — market data (inbound)

Docs: https://finnhub.io/docs/api

> Filename keeps the historical spelling `finhub`; the provider is **Finnhub**.

## Why we integrate

Finnhub is UraBot's source of truth for the uranium market. Two distinct needs:

1. **Real-time stock quotes** for each tracked uranium ticker (the stock roundup post).
2. **Recent company news** per ticker (the news post).

The provider is replaceable — what matters is that the rewrite gets these two kinds
of data in the shapes below.

## Authentication

API token, supplied as a request parameter. Comes from config; required at startup.

## 1. Real-time quote

**We ask for:** a single ticker symbol.

**We need back** (normalized to what the bot uses):

| Field | Meaning |
|-------|---------|
| `symbol` | the ticker |
| `price` | current price |
| `highPrice` | day high |
| `lowPrice` | day low |
| `openPrice` | day open |
| `previousClosePrice` | previous close |

Notes on format:
- The provider returns short keys (`c`, `h`, `l`, `o`, `pc`); we map them to the
  descriptive names above.
- Prices are rounded to **2 decimal places**.
- The post derives change/direction (vs. previous close / open) from these fields.

## 2. Company news

**We ask for:** a ticker symbol and a date range (`from`, `to`).
- Default range when unspecified: **the last day** (yesterday → today).
- Dates are formatted `YYYY-MM-DD`.

**We need back** a list of news items, each with:

| Field | Meaning |
|-------|---------|
| `headline` | article title |
| `summary` | short description |
| `url` | link to the article |
| `source` | publisher |
| `category` | news category |
| `related` | related symbol(s) |
| `image` | image URL |
| `id` | provider article id |

The bot selects/filters relevant items and may pass the headline/summary to the LLM
(see [replicate-ai.md](./replicate-ai.md)) for commentary.

## Tracked tickers

These are the uranium-related symbols the bot follows. They are **bot configuration**,
not provider behavior — the rewrite should treat this as an editable list, not a
hardcoded constant.

Currently tracked — the symbols are verbatim from the legacy `STOCKS` list. In the
**Note** column, ✎ marks a comment copied from the source code; the rest are company
names added for readability and should be verified before relying on them.

| Symbol | Note |
|--------|------|
| `CCJ` | ✎ Cameco — second largest producer in the world |
| `DNN` | Denison Mines |
| `NXE` | ✎ NexGen Energy ("Next Gen Energy" in source) |
| `SMR` | ✎ NuScale Power Corporation |
| `SRUUF` | Sprott Physical Uranium Trust (OTC) |
| `UEC` | ✎ Uranium Energy Corp |
| `URA` | ✎ ETF — ≈23% Cameco, 20% Kazatomprom, rest outside the uranium market |
| `URNM` | Sprott Uranium Miners ETF |
| `UUUU` | ✎ Energy Fuels |
| `URNJ` | Sprott Junior Uranium Miners ETF |
| `UROY` | Uranium Royalty Corp |

> The legacy code split these into a "NYSE" group (the first nine) and an "other"
> group (`URNJ`, `UROY`), but the split isn't meaningful — the list mixes
> exchange-listed equities, OTC (`SRUUF`), and ETFs (`URA`, `URNM`, `URNJ`). For the
> rewrite, treat it as one flat, editable watchlist and confirm the data provider
> supports every symbol's format.

## Chunking

The stock roundup is split into batches of **6 tickers per message**
(`MAX_STOCKS_PER_MESSAGE`) to stay under the social platforms' character limits. This
is a posting concern, not a Finnhub concern, but it bounds how many quotes a single
post represents.

## Requirements for the rewrite

- Handle missing/empty data gracefully (a ticker may have no news, or a quote field
  may be zero) — never post a malformed/empty roundup.
- Respect provider rate limits.
- Tracked tickers are bot configuration, not hardcoded provider behavior.
