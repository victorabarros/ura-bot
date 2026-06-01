import { TwitterApi } from "twitter-api-v2"
import { ISocialService, PostMessageResponse } from "./ISocialService"
import config from "../config"

const client = new TwitterApi({
  appKey: config.x.consumerKey,
  appSecret: config.x.consumerSecret,
  accessToken: config.x.accessToken,
  accessSecret: config.x.accessTokenSecret,
})

export class XService implements ISocialService {
  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    const { data } = await client.v2.tweet(text)
    return { id: data.id }
  }
}
