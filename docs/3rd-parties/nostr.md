# Nostr — social posting (outbound)

Protocol: https://github.com/nostr-protocol/nostr

## Why we integrate

To publish UraBot's posts to the Nostr network. One implementation of the shared
[outbound posting contract](./README.md#outbound-posting-all-social-targets).

Unlike X, Nostr is a **protocol, not a single company** — posts ("events") are signed
locally and broadcast to a set of relays.

## Content / format

- **Input:** one plain-text message (trimmed).
- Published as a standard **text note** (a kind-1 / `Text` event).
- **Output:** the published event's **id**.

## Authentication / identity

- Posts are signed with the bot's **private key** (the bot's Nostr identity).
- The key and the **list of relay URLs** to broadcast to come from config; required
  at startup.
- No token refresh — the signing key is long-lived. Keep it secret.

## Requirements for the rewrite

- Connect to relays with a **timeout** so a slow/dead relay can't hang the request.
- Broadcast to **multiple relays**; treat the post as successful if it reaches the
  network (don't fail because one relay is down).
- Return the real event id so the fan-out can report per-platform results.
