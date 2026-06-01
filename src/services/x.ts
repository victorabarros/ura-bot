import { TwitterApi } from "twitter-api-v2"
import { ISocialService, PostMessageResponse } from "./ISocialService"
import config from "../config"

const client = new TwitterApi({
  appKey: config.x.consumerKey,
  appSecret: config.x.consumerSecret,
  accessToken: config.x.accessToken,
  accessSecret: config.x.accessTokenSecret,
})

/**
 * Verifies X OAuth 1.0a credentials via the authenticated user lookup.
 *
 * @see https://docs.x.com/
 * @see docs/3rd-parties/twitter-x-dot-com.md
 */
export async function checkXHealth(): Promise<void> {
  await client.v2.me()
}

export class XService implements ISocialService {
  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    const { data } = await client.v2.tweet(text)
    return { id: data.id }
  }
}
