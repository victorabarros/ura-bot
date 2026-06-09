import { Request, Response } from "express"
import httpStatus from "http-status"
import { XService, TweetResult } from "../services/x"
import { generateTrendingComment } from "../services/replicate"
import { buildTrendingMessage } from "../domain/stocks"
import {
  errorMessage,
  logIntegrationError,
  respondInternalError,
  respondUpstreamUnavailable,
} from "../http/errors"

const xService = new XService()

/** Stop retrying after this many consecutive quote-not-allowed 403s. */
const MAX_QUOTE_ATTEMPTS = 5

/** X 403 detail for when the API prevents quoting a specific tweet. */
const QUOTE_NOT_ALLOWED_DETAIL = "Quoting this post is not allowed"

function isQuoteNotAllowed(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const data = "data" in err ? (err as { data?: { detail?: string } }).data : undefined
  return typeof data?.detail === "string" && data.detail.startsWith(QUOTE_NOT_ALLOWED_DETAIL)
}

function byEngagementDesc(tweets: TweetResult[]): TweetResult[] {
  return [...tweets].sort(
    (a, b) => b.likeCount + b.retweetCount - (a.likeCount + a.retweetCount),
  )
}

/**
 * Attempts to quote-tweet the first eligible candidate from the pool.
 * Returns { quoteTweetId, quotedTweetId } on success, null when every
 * candidate is rejected by X (quote-not-allowed 403). Throws on other errors.
 */
async function tryQuoteTweet(
  text: string,
  candidates: TweetResult[],
): Promise<{ quoteTweetId: string; quotedTweetId: string } | null> {
  const pool = candidates.slice(0, MAX_QUOTE_ATTEMPTS)
  for (const tweet of pool) {
    console.log(
      `[top-trending] attempting quote id=${tweet.id} reply_settings=${tweet.replySettings} likes=${tweet.likeCount} rt=${tweet.retweetCount}`,
    )
    try {
      const result = await xService.quoteTweet(text, tweet.id)
      return { quoteTweetId: result.id, quotedTweetId: tweet.id }
    } catch (err) {
      if (isQuoteNotAllowed(err)) {
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
 *   1. Fetch recent @mentions — the bot is always part of these conversations
 *      so the X API allows quoting them without restriction.
 *   2. If mentions exist → generate comment → quote the top-engagement mention.
 *   3. If no mentions → fetch top uranium tweets → generate comment → plain post.
 *
 * `204` when no content source is available; `503`/`500` on failures.
 */
export async function postTopTrending(_req: Request, res: Response): Promise<void> {
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
      const ranked = byEngagementDesc(mentions)

      let comment: string
      try {
        comment = await generateTrendingComment(ranked)
      } catch (err) {
        logIntegrationError("top-trending", "replicate", err)
        respondUpstreamUnavailable(res, "replicate", "Replicate comment generation failed")
        return
      }

      const text = buildTrendingMessage(comment)

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
        respondUpstreamUnavailable(res, "x", "X quote tweet failed")
        return
      }

      console.warn("[top-trending] mention quote attempts all failed — falling back to trending plain post")
    }

    // --- Step 2: fallback — trending search + plain post ---
    let tweets: TweetResult[] = []
    try {
      tweets = await xService.searchTweets(10)
    } catch (err) {
      logIntegrationError("top-trending", "x/search", err)
      respondUpstreamUnavailable(res, "x", "X tweet search failed")
      return
    }

    if (tweets.length === 0 && mentions.length === 0) {
      res.status(httpStatus.NO_CONTENT).send()
      return
    }

    const context = tweets.length > 0 ? tweets : mentions

    let comment: string
    try {
      comment = await generateTrendingComment(context)
    } catch (err) {
      logIntegrationError("top-trending", "replicate", err)
      respondUpstreamUnavailable(res, "replicate", "Replicate comment generation failed")
        return
    }

    const text = buildTrendingMessage(comment)

    let tweetId: string
    try {
      const result = await xService.postMessage(text)
      tweetId = result.id
      console.log(`[top-trending] plain post id=${tweetId}`)
    } catch (err) {
      logIntegrationError("top-trending", "x", err)
      respondUpstreamUnavailable(res, "x", "X post failed")
      return
    }

    res.status(httpStatus.OK).json({ created_at: now, tweet_id: tweetId })
  } catch (err) {
    logIntegrationError("top-trending", "internal", err)
    respondInternalError(res, "internal", errorMessage(err))
  }
}
