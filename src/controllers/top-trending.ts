import { Request, Response } from "express"
import httpStatus from "http-status"
import { uraBotXService, TweetResult } from "../services/x"
import { generateComment } from "../services/replicate"
import { URANIUM_SEARCH_QUERY } from "../domain/stocks"
import { ApiErrorBody, logIntegrationError } from "../http/errors"

const xService = uraBotXService

/** Stop retrying after this many consecutive quote-not-allowed 403s. */
const MAX_QUOTE_ATTEMPTS = 5

/** X 403 detail returned when the API prevents quoting a specific tweet. */
const QUOTE_NOT_ALLOWED_DETAIL = "Quoting this post is not allowed"

/**
 * Attempts to quote-tweet the first eligible candidate from the pool.
 * Returns { quoteTweetId, quotedTweetId } on success, null when every
 * candidate is rejected by X (quote-not-allowed 403). Throws on other errors.
 */
const tryQuoteTweet = async (
  text: string,
  candidates: TweetResult[],
): Promise<{ quoteTweetId: string; quotedTweetId: string } | null> => {
  for (const tweet of candidates.slice(0, MAX_QUOTE_ATTEMPTS)) {
    console.log(
      `[top-trending] attempting quote id=${tweet.id} likes=${tweet.likeCount} rt=${tweet.retweetCount}`,
    )
    try {
      const result = await xService.quoteTweet(text, tweet.id)
      return { quoteTweetId: result.id, quotedTweetId: tweet.id }
    } catch (err) {
      const data = err && typeof err === "object" && "data" in err
        ? (err as { data?: { detail?: string } }).data
        : undefined
      if (typeof data?.detail === "string" && data.detail.startsWith(QUOTE_NOT_ALLOWED_DETAIL)) {
        logIntegrationError("top-trending", "x/quote-not-allowed", err)
        continue
      }
      throw err
    }
  }
  return null
}

/**
 * POST /urabot/top-trending:
 *   1. Fetch recent @mentions — the bot is part of these conversations so
 *      the X API allows quoting them without restriction.
 *   2. If mentions exist → generate comment → quote the top-engagement mention.
 *   3. If no mentions → fetch top uranium tweets → generate comment → plain post.
 *
 * `204` when no content source is available; `503`/`500` on failures.
 */
export const postTopTrending = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date()

  try {
    // --- Step 1: try mentions-based quote tweet ---
    let mentions: TweetResult[] = []
    try {
      mentions = await xService.getMentions(20)
      console.log(`[top-trending] fetched ${mentions.length} mention(s)`)
    } catch (err) {
      logIntegrationError("top-trending", "x/mentions", err)
      // non-fatal — fall through to trending plain post
    }

    if (mentions.length > 0) {
      const ranked = [...mentions].sort(
        (a, b) => b.likeCount + b.retweetCount - (a.likeCount + a.retweetCount),
      )

      let comment: string
      try {
        comment = await generateComment(
          `Write a post (up to 200 characters) reacting to what uranium investors are talking about on X right now (don't use hashtag with uranium word): ${JSON.stringify(ranked.map(({ text, likeCount, retweetCount }) => ({ text, likeCount, retweetCount })))}`
        )
      } catch (err) {
        logIntegrationError("top-trending", "replicate", err)
        res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Replicate comment generation failed", integration: "replicate" } satisfies ApiErrorBody)
        return
      }

      const text = [comment, "", "#Uranium☢️"].join("\n")

      try {
        const quoted = await tryQuoteTweet(text, ranked)
        if (quoted) {
          console.log(`[top-trending] quoted mention id=${quoted.quotedTweetId} → new id=${quoted.quoteTweetId}`)
          res.status(httpStatus.OK).json({
            created_at: now,
            tweet_id: quoted.quoteTweetId,
            quoted_tweet_id: quoted.quotedTweetId,
          })
          return
        }
      } catch (err) {
        logIntegrationError("top-trending", "x", err)
        res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "X quote tweet failed", integration: "x" } satisfies ApiErrorBody)
        return
      }

      console.warn("[top-trending] mention quote attempts all failed — falling back to trending plain post")
    }

    // --- Step 2: fallback — trending search + plain post ---
    let tweets: TweetResult[] = []
    try {
      tweets = await xService.searchTweets(URANIUM_SEARCH_QUERY, 10)
    } catch (err) {
      logIntegrationError("top-trending", "x/search", err)
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "X tweet search failed", integration: "x" } satisfies ApiErrorBody)
      return
    }

    if (tweets.length === 0 && mentions.length === 0) {
      res.status(httpStatus.NO_CONTENT).send()
      return
    }

    let comment: string
    try {
      const posts = tweets.length > 0 ? tweets : mentions
      comment = await generateComment(
        `Write a post (up to 200 characters) reacting to what uranium investors are talking about on X right now (don't use hashtag with uranium word): ${JSON.stringify(posts.map(({ text, likeCount, retweetCount }) => ({ text, likeCount, retweetCount })))}`
      )
    } catch (err) {
      logIntegrationError("top-trending", "replicate", err)
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Replicate comment generation failed", integration: "replicate" } satisfies ApiErrorBody)
      return
    }

    const text = [comment, "", "#Uranium☢️"].join("\n")

    try {
      const { id } = await xService.postMessage(text)
      console.log(`[top-trending] plain post id=${id}`)
      res.status(httpStatus.OK).json({ created_at: now, tweet_id: id })
    } catch (err) {
      logIntegrationError("top-trending", "x", err)
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "X post failed", integration: "x" } satisfies ApiErrorBody)
    }
  } catch (err) {
    logIntegrationError("top-trending", "internal", err)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err instanceof Error ? err.message : String(err), integration: "internal" } satisfies ApiErrorBody)
  }
}
