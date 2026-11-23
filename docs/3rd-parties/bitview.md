# Bitview (BRK)

## Purpose

Fetches Bitcoin on-chain metrics — MVRV ratio, realized price, and the 55-day and
200-day price moving averages — for the `POST /bitcoinmetrx/price` endpoint.
The 55-day average is labeled MA50 in the post (nearest Fibonacci window to 50 days).

## Endpoint used

```
GET https://bitview.space/api/series/bulk
  ?index=day1
  &series=mvrv,realized_price,price_sma_200d,price_sma_55d
  &start=-1
```

`index` must be the exact name `day1`. BRK v0.13.0 (2026-10-30) dropped the old
aliases, including `day`. A request with `index=day` is HTTP 400 and names `day1`
as the replacement. `start=-1` returns only the latest point for each series.

`GET /healthcheck` uses this same query as the Bitview probe. `GET /health` on
Bitview stays successful when the series query is rejected, so the probe does not
call it.

## Auth

None. Fully public, no key required.

## Response shape

```json
[
  { "index": "day1", "type": "Multiple", "data": [1.19] },
  { "index": "day1", "type": "Dollars", "data": [53164.35] },
  { "index": "day1", "type": "Dollars", "data": [72348.3] },
  { "index": "day1", "type": "Dollars", "data": [77219.54] }
]
```

Array order matches the `series` parameter order: `mvrv`, `realized_price`,
`price_sma_200d`, then `price_sma_55d`. The latest value is `data[0]`. Extra
fields (`version`, `start`, `end`, `type`) are ignored.

## Failure handling

If the request fails or returns an unexpected shape the controller logs the error
and omits the on-chain section (MVRV, realized price, and moving averages). The
price post continues without that section. `GET /healthcheck` reports Bitview as
failed.

## Links

- Bitview site: https://bitview.space
- API documentation: https://bitview.space/api
- What each release changed: https://bitview.space/changes/
