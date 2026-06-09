import { TwitterApi } from "twitter-api-v2"
import { ISocialService, PostMessageResponse } from "./ISocialService"
import config from "../config"

const client = new TwitterApi({
  appKey: config.x.consumerKey,
  appSecret: config.x.consumerSecret,
  accessToken: config.x.accessToken,
  accessSecret: config.x.accessTokenSecret,
})

export type TweetResult = {
  id: string
  text: string
  authorId: string
  createdAt: string
  likeCount: number
  retweetCount: number
  /** X reply_settings field. "everyone" | "mentionedUsers" | "subscribers" */
  replySettings: string
}

/** Default uranium search query — high-signal tickers, no retweets, English only. */
const URANIUM_QUERY = "(uranium OR $UEC OR $CCJ OR $URA OR $URNM) -is:retweet lang:en"

const TWEET_FIELDS: ("created_at" | "public_metrics" | "author_id" | "reply_settings")[] = [
  "created_at", "public_metrics", "author_id", "reply_settings",
]

function mapTweet(tweet: {
  id: string
  text: string
  author_id?: string
  created_at?: string
  public_metrics?: { like_count?: number; retweet_count?: number }
  reply_settings?: string
}): TweetResult {
  return {
    id: tweet.id,
    text: tweet.text,
    authorId: tweet.author_id ?? "",
    createdAt: tweet.created_at ?? "",
    likeCount: tweet.public_metrics?.like_count ?? 0,
    retweetCount: tweet.public_metrics?.retweet_count ?? 0,
    replySettings: tweet.reply_settings ?? "everyone",
  }
}

/** Lazily resolved user ID for the authenticated bot account. */
let _botUserId: string | undefined

async function getBotUserId(): Promise<string> {
  if (_botUserId) return _botUserId
  const { data } = await client.v2.me()
  _botUserId = data.id
  return _botUserId
}

/**
 * Verifies X OAuth 1.0a credentials via the authenticated user lookup.
 *
 * @see https://docs.x.com/
 * @see docs/3rd-parties/twitter-x-dot-com.md
 */
export async function checkXHealth(): Promise<void> {
  console.log("[health] checking X connectivity")
  await client.v2.me()
}

export class XService implements ISocialService {
  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    const { data } = await client.v2.tweet(text)
    return { id: data.id }
  }

  /**
   * Posts a quote tweet (retweet with comment) on top of an existing tweet.
   *
   * @see https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  async quoteTweet(text: string, quoteTweetId: string): Promise<PostMessageResponse> {
    const trimmed = text.trim()
    if (!trimmed) throw new Error("X: quote tweet text cannot be empty")
    if (!quoteTweetId) throw new Error("X: quoteTweetId is required")

    const { data } = await client.v2.tweet({ text: trimmed, quote_tweet_id: quoteTweetId })
    return { id: data.id }
  }

  /**
   * Returns recent tweets that mention the bot account, sorted by engagement.
   * The bot is always part of these conversations so quote tweeting them is
   * permitted by the X API without restriction.
   *
   * @see https://developer.x.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-mentions
   */
  async getMentions(limit = 10): Promise<TweetResult[]> {
    const userId = await getBotUserId()
    const { data } = await client.v2.userMentionTimeline(userId, {
      max_results: Math.min(Math.max(limit, 5), 100),
      "tweet.fields": TWEET_FIELDS,
    })

    return (data.data ?? []).map(mapTweet)
  }

  /**
   * Searches recent tweets about uranium, sorted by relevancy.
   * Returns up to `limit` results with engagement metrics.
   *
   * Requires at minimum the Basic X API access tier.
   *
   * @see https://developer.x.com/en/docs/twitter-api/tweets/search/introduction
   */
  async searchTweets(limit = 10): Promise<TweetResult[]> {
    const { data } = await client.v2.search(URANIUM_QUERY, {
      max_results: Math.min(Math.max(limit, 10), 100),
      "tweet.fields": TWEET_FIELDS,
      sort_order: "relevancy",
    })

    return (data.data ?? []).map(mapTweet)
  }
}
