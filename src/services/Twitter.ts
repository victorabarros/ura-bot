import Twitter from "twitter-lite"
import config from "../config"

const { apiKey, apiKeySecret, accessToken, accessTokenSecret } = config.twitter.uraBot

interface IWriteTweetResponse {
  id: string
}

interface ITwitterService {
  writeTweet(message: string): Promise<IWriteTweetResponse>
  check(): Promise<boolean>
}

class TwitterService implements ITwitterService {
  private client: Twitter

  constructor(config: Twitter) {
    this.client = config
  }

  async writeTweet(message: string): Promise<IWriteTweetResponse> {
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

export const UraTwitterService = new TwitterService(new Twitter({
  consumer_key: apiKey,
  consumer_secret: apiKeySecret,
  access_token_key: accessToken,
  access_token_secret: accessTokenSecret,
}))

export const BrlTwitterService = new TwitterService(new Twitter({
  consumer_key: config.twitter.brlBot.apiKey,
  consumer_secret: config.twitter.brlBot.apiKeySecret,
  access_token_key: config.twitter.brlBot.accessToken,
  access_token_secret: config.twitter.brlBot.accessTokenSecret,
}))
