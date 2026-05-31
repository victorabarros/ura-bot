# Anti-patterns & Known Gaps

Things found in the legacy codebase that the rewrite must **not** repeat, plus
decisions that were left incomplete and need resolution.

---

## Do not repeat

### Stub persistence
`CacheRepository.get` always returns `null`; `set` is a no-op. The X access
token is therefore re-fetched on every request, burning refresh-token quota and
adding latency. The rewrite must implement real Redis reads/writes or
explicitly decide to drop the cache.

### Dual X/Twitter clients
The legacy code has two separate integrations for the same platform:
`Twitter.ts` (OAuth 1.0a, v1.1 API) and `XSocial/` (OAuth 2.0 PKCE, v2 API).
Both are wired and both post on every trigger. Keep only `XSocial` (OAuth 2.0).

### `Promise.all` for fan-out
The current fan-out uses `Promise.all`, which means a single failing platform
rejects the entire batch and the other platforms may not post. Use
`Promise.allSettled` and log individual failures without aborting the others.

### Hardcoded holiday list
Market holidays are baked into the source as a multi-year static array. This
will silently break when the array goes out of date. The rewrite should fetch
holidays from the Finnhub market-calendar API and fall back to a short hardcoded
list only when the API is unavailable.

### Exact-minute time checks for schedule context
`isFirstPostOfDay` and `isEveningPost` rely on the call arriving at exactly
`HH:MM === "14:00"` / `"21:00"`. A one-second cron drift silently skips the
greeting. Use a time-window (e.g. ±5 minutes) or pass intent explicitly
via query parameter.

### Nostr `postMessage` returning `"TODO"` as id
`NostrService.postMessage` always resolves with `{ id: "TODO" }`. Nostr events
have real deterministic IDs; extract and return the actual event ID.

### `onRefreshToken` type mismatch
`XSocialServiceProps.onRefreshToken` is declared as `(token: string) => Promise<void>`
but the implementation calls it with `{ accessToken, refreshToken }`. Fix the
type at the interface level rather than at the call site.

---

## Open decisions for the rewrite

| Topic | Current state | Recommendation |
|---|---|---|
| **Cache backend** | Redis (stub) | Implement real Redis client, or if stateless is preferred, persist tokens in env/secrets manager and skip the cache |
| **Holiday source** | Hardcoded 2024-2026 | Fetch from Finnhub `/calendar/economic` or equivalent; keep hardcoded as fallback |
| **Post timing context** | Hardcoded clock checks | Accept optional `context` param from caller (`morning` / `evening` / `neutral`) or use a ±5 min window |
| **Nostr event ID** | `"TODO"` | Return real NDK event ID from `event.id` after publish |
| **X token persistence** | In-memory + broken cache | Persist refresh token back to env/secrets store in the `onRefreshToken` callback |
