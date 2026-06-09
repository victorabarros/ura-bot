import axios from "axios"
import { TwitterApi } from "twitter-api-v2"
import config from "../config"
import { ISocialService, PostMessageResponse } from "./ISocialService"

export type XCredentials = {
  consumerKey: string
  consumerSecret: string
  accessToken: string
  accessTokenSecret: string
}

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

export type LatestPost = {
  id: string
  text: string
  createdAt: string
  url: string
}

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

export class XService implements ISocialService {
  private readonly client: TwitterApi
  private _me: { id: string; username: string } | undefined

  constructor(credentials: XCredentials) {
    this.client = new TwitterApi({
      appKey: credentials.consumerKey,
      appSecret: credentials.consumerSecret,
      accessToken: credentials.accessToken,
      accessSecret: credentials.accessTokenSecret,
    })
  }

  private async getMe(): Promise<{ id: string; username: string }> {
    if (this._me) return this._me
    const { data } = await this.client.v2.me()
    this._me = { id: data.id, username: data.username }
    return this._me
  }

  /**
   * Returns the most recent original post from this account's timeline.
   * Excludes retweets and replies.
   */
  async getLatestPost(): Promise<LatestPost> {
    const { id, username } = await this.getMe()
    const { data } = await this.client.v2.userTimeline(id, {
      max_results: 5,
      exclude: ["retweets", "replies"],
      "tweet.fields": ["created_at"],
    })
    const tweet = data.data?.[0]
    if (!tweet) throw new Error("No posts found on this account")
    return {
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at ?? new Date().toISOString(),
      url: `https://x.com/${username}/status/${tweet.id}`,
    }
  }

  /**
   * Verifies X OAuth 1.0a credentials via the authenticated user lookup.
   *
   * @see https://docs.x.com/
   * @see docs/3rd-parties/twitter-x-dot-com.md
   */
  async checkHealth(): Promise<void> {
    console.log("[health] checking X connectivity")
    await this.client.v2.me()
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    const { data } = await this.client.v2.tweet(text)
    return { id: data.id }
  }

  /**
   * Downloads the image from `imageUrl`, uploads it via the X v1 media API,
   * then publishes the tweet with the attached media.
   *
   * @see https://developer.x.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload
   */
  async postWithImage(message: string, imageUrl: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    const response = await axios.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" })
    const buffer = Buffer.from(response.data)
    const mimeType = (response.headers["content-type"] as string | undefined) ?? "image/jpeg"

    const mediaId = await this.client.v1.uploadMedia(buffer, { mimeType })
    const { data } = await this.client.v2.tweet({ text, media: { media_ids: [mediaId] } })
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

    const { data } = await this.client.v2.tweet({ text: trimmed, quote_tweet_id: quoteTweetId })
    return { id: data.id }
  }

  /**
   * Returns recent tweets that mention this account, sorted by engagement.
   *
   * @see https://developer.x.com/en/docs/twitter-api/tweets/timelines/api-reference/get-users-id-mentions
   */
  async getMentions(limit = 10): Promise<TweetResult[]> {
    const { id } = await this.getMe()
    const { data } = await this.client.v2.userMentionTimeline(id, {
      max_results: Math.min(Math.max(limit, 5), 100),
      "tweet.fields": TWEET_FIELDS,
    })

    return (data.data ?? []).map(mapTweet)
  }

  /**
   * Searches recent tweets matching `query`, sorted by relevancy.
   * Requires at minimum the Basic X API access tier.
   *
   * @see https://developer.x.com/en/docs/twitter-api/tweets/search/introduction
   */
  async searchTweets(query: string, limit = 10): Promise<TweetResult[]> {
    const { data } = await this.client.v2.search(query, {
      max_results: Math.min(Math.max(limit, 10), 100),
      "tweet.fields": TWEET_FIELDS,
      sort_order: "relevancy",
    })

    return (data.data ?? []).map(mapTweet)
  }
}

/** Default UraBot X account — used by controllers that are not account-specific. */
export const uraBotXService = new XService(config.x)

