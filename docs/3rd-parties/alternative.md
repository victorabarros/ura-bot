# Alternative.me — Crypto Fear & Greed Index

## Purpose

Fetches the current Crypto Fear & Greed index value and classification for the
`POST /bitcoinmetrx/price` endpoint.

## Endpoint used

```
GET https://api.alternative.me/fng/?limit=1
```

## Auth

None. Fully public, no key required.

## Response shape

```json
{
  "data": [
    {
      "value": "72",
      "value_classification": "Greed"
    }
  ]
}
```

The `value` field is a numeric string (0–100); it is parsed to `int` in
`src/services/feargreed.ts`. Possible `value_classification` labels:
`Extreme Fear`, `Fear`, `Neutral`, `Greed`, `Extreme Greed`.

## Failure handling

If the request fails the controller logs the error and omits the Fear & Greed
line from the post (graceful degradation). The price post continues without it.

## Links

- Index overview: https://alternative.me/crypto/fear-and-greed-index/
- API endpoint: https://api.alternative.me/fng/
