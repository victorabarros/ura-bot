# CoinGecko

## Purpose

Fetches live Bitcoin price, 24h change percentage, market cap, and 24h trading
volume for the `POST /bitcoinmetrx/price` endpoint.

## Endpoint used

```
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin
  &vs_currencies=usd
  &include_market_cap=true
  &include_24hr_vol=true
  &include_24hr_change=true
```

## Auth

None. Uses the keyless public API tier.

## Rate limits

The Demo (keyless) tier allows 10–30 calls/minute. The `POST /bitcoinmetrx/price`
endpoint is externally triggered (cron) so there is no risk of exceeding this.

## Response shape (relevant fields)

```json
{
  "bitcoin": {
    "usd": 105432,
    "usd_24h_change": 2.31,
    "usd_market_cap": 2090000000000,
    "usd_24h_vol": 48000000000
  }
}
```

## Failure handling

If the request fails the controller returns `503 Service Unavailable` — price is
the required minimum for a meaningful post.

## Links

- Public API docs: https://docs.coingecko.com/docs/keyless-public-api
