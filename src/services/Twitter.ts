import { TwitterApi } from "twitter-api-v2"
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

  constructor(twitterLite: Twitter) {
    this.client = twitterLite
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

  private readonly twitterClient: TwitterApi

  constructor() {
    // todo move to params
    this.twitterClient = new TwitterApi({
      appKey: config.twitter.brlBot.apiKey,
      appSecret: config.twitter.brlBot.apiKeySecret,
      accessToken: config.twitter.brlBot.accessToken,
      accessSecret: config.twitter.brlBot.accessTokenSecret,
    })

    // this.twitterClient = new TwitterApi({
    //   clientId: config.twitter.brlBot.clientId,
    //   clientSecret: config.twitter.brlBot.clientSecret,
    // })

    // this.twitterClient = new TwitterApi(config.twitter.brlBot.bearerToken)
  }

  async writeTweet(message: string): Promise<WriteTweetResponse> {
    throw new Error("not implemented")
  }

  async check(): Promise<boolean> {
    const readOnlyClient = this.twitterClient.readOnly
    const user = await readOnlyClient.v2.userByUsername("brlbot")
    console.log({ user })
    // await this.twitterClient.v2.tweet("hi")
    // await this.twitterClient.v1.tweet("Hello, this is a test.")
    // await this.twitterClient.v1.uploadMedia("./big-buck-bunny.mp4")

    throw new Error("not implemented")
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
// export const BrlTwitterService = new TwitterServiceV2()
