# Bitview (BRK)

## Purpose

Fetches Bitcoin on-chain metrics — MVRV ratio and Realized Price — for the
`POST /bitcoinmetrx/price` endpoint.

## Endpoint used

```
GET https://bitview.space/api/series/bulk
  ?index=day
  &series=mvrv,realized_price
  &start=-1
```

`start=-1` returns only the latest data point for each series, minimizing payload
size.

## Auth

None. Fully public, no key required.

## Response shape

```json
[
  { "data": [2.41] },
  { "data": [53549.19] }
]
```

Array order matches the `series` parameter order: `mvrv` first, `realized_price`
second.

## Failure handling

If the request fails or returns unexpected shape the controller logs the error and
omits the MVRV / Realized Price section from the post (graceful degradation). The
price post continues without on-chain data.

## Links

- Bitview site: https://bitview.space
- API documentation: https://bitview.space/api
