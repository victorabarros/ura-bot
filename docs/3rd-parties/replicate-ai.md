# Replicate — LLM commentary (inbound)

Docs: https://replicate.com/docs

## Why we integrate

To generate UraBot's **commentary** on news in a consistent voice. The LLM does not
decide *what* to post — the bot gathers the news and asks the model to comment.

The provider and model are an implementation choice. What is contractual is the
**voice** and the **request/response shape**.

## Authentication

API key from config; required at startup.

## Model (Replicate slug)

| Model | Notes |
|-------|--------|
| **`meta/meta-llama-3-70b-instruct`** (default) | Drop-in replacement for retired `meta/meta-llama-3.1-405b-instruct`. Same `system_prompt` + `prompt` API as legacy. Good for acid-humor market takes; news context is supplied in the user prompt (Finnhub JSON). |
| **`openai/gpt-4o-mini`** | Set `REPLICATE_MODEL=openai/gpt-4o-mini`. Stronger instruction-following and cleaner output; uses `max_completion_tokens` instead of `max_tokens`. Slightly higher cost. |

`meta/meta-llama-3.1-405b-instruct` returns HTTP 422 on Replicate as of 2026 — do not use.

News “recency” does not depend on the model’s training cutoff: Finnhub provides the
headline, summary, and URL in the prompt.

## The voice (the actual contract)

UraBot speaks as **an investor and influencer in the uranium stock market**:

- Uses **non-casual** (professional/market) terms.
- Carries **a bit of acid humor**.
- **Never uses hashtags.**
- **Never uses external links.**

This persona is the deliverable. If the model or provider changes, the voice must not.

## Content / format

**We send:**
- A **system prompt** encoding the persona voice above.
- A **user prompt** — the news context to comment on.
- Generation settings tuned for short, slightly creative output (reference values
  from the legacy setup: temperature ~0.6, top_p ~0.9, top_k ~50, max output ~1024
  tokens). These are tunable knobs, not contractual.

### System prompt (the persona — verbatim from the legacy bot)

```
You are an investor and influencer about the uranium stock market,
always posting with not casual terms and with a bit of acid humor.
Never uses hashtags or external links.
```

### User prompt (news commentary — verbatim from the legacy bot)

The bot picks one random news item and appends the **entire news object as JSON** to
this instruction:

```
Write a post (up to 200 characters) about the news (don't use hashtag with uranium word): {news as JSON}
```

Where `{news as JSON}` is the whole Finnhub news item — headline, summary, url,
source, etc. (see [finhub.md](./finhub.md#2-company-news)).

> **Observed quirks worth fixing in the rewrite:**
> - The prompt dumps the raw JSON object at the model rather than a clean
>   headline/summary — noisy and token-wasteful. Prefer passing only the fields that
>   matter.
> - The 200-character limit lives in the prompt text, so it's a *request*, not a
>   guarantee — the output still needs hard validation against the platform limit.
> - The prompt says "don't use hashtag," yet the post-composition step appends
>   `#Uranium☢️` and the article URL *after* the LLM output — so the final post does
>   contain a hashtag and a link, contradicting the persona's "never hashtags/links."
>   Decide intentionally in the rewrite whether hashtags/links are allowed, and keep
>   the prompt and the composition consistent.

These strings are the starting point, not sacred — but the **voice and intent** (acid
humor, market tone) must survive any rewording.

**We get back:**
- A single block of **plain text** — the comment.
- It must be cleaned for posting: trimmed, and any wrapping quote characters removed.
- It must already obey the voice rules (no hashtags, no links) so it can go straight
  into a social post.

## Requirements for the rewrite

- Keep the persona in **one place** so the voice is easy to audit and adjust.
- Output must be safe to post as-is (length-aware for the target platform, no links/
  hashtags); validate before posting.
- If comment generation fails, return **`503`** with `integration: "replicate"` — do not
  post with a silent headline fallback.
