import Twitter from "twitter-lite"
import config from "../config"

const { apiKey, apiKeySecret, accessToken, accessTokenSecret } = config.twitter.uraBot

type WriteTweetResponse = {
  id: string
}

interface ITwitterService {
  writeTweet(message: string): Promise<WriteTweetResponse>
  check(): Promise<boolean>
}

class TwitterService implements ITwitterService {
  private client: Twitter

  constructor(config: Twitter) {
    this.client = config
  }

  async writeTweet(message: string): Promise<WriteTweetResponse> {
    const { id_str } = await this.client.post("statuses/update", { status: message })
    return { id: id_str }
  }

  async check(): Promise<boolean> {
    try {
      await this.client.getBearerToken()
      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }
}

class TwitterServiceV2 implements ITwitterService {
  constructor(config: unknown) {
  }

  async writeTweet(message: string): Promise<WriteTweetResponse> {
    throw new Error("not implemented")
  }

  async check(): Promise<boolean> {
    throw new Error("not implemented")
  }
}

export const UraTwitterService = new TwitterService(new Twitter({
  consumer_key: apiKey,
  consumer_secret: apiKeySecret,
  access_token_key: accessToken,
  access_token_secret: accessTokenSecret,
}))

export const BrlTwitterService = new TwitterServiceV2(new Twitter({
  consumer_key: config.twitter.brlBot.apiKey,
  consumer_secret: config.twitter.brlBot.apiKeySecret,
  access_token_key: config.twitter.brlBot.accessToken,
  access_token_secret: config.twitter.brlBot.accessTokenSecret,
}))
