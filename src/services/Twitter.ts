import request, { OAuthOptions } from "request"
import config from "../config"

const { uraBot, brlBot, baseUrl } = config.twitter

type WriteTweetResponse = {
  id: string
}

type TwitterServiceProps = {
  apiKey: string
  apiKeySecret: string
  accessToken: string
  accessTokenSecret: string
}

interface ITwitterService {
  writeTweet(message: string): Promise<WriteTweetResponse>
  check(): Promise<void>
}

class TwitterService implements ITwitterService {
  private oauth: OAuthOptions

  constructor(props: TwitterServiceProps) {
    this.oauth = {
      consumer_key: props.apiKey,
      consumer_secret: props.apiKeySecret,
      token: props.accessToken,
      token_secret: props.accessTokenSecret,
    }
  }

  async writeTweet(message: string): Promise<WriteTweetResponse> {
    const options = {
      method: "POST",
      url: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      oauth: this.oauth,
      body: JSON.stringify({ "text": message })
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
      console.log(body)
    })

    return { id: "mock" }
  }

  check(): Promise<void> {
    throw new Error("Method not implemented.")
  }
}


export const UraTwitterService = new TwitterService({ ...uraBot })


export const BrlTwitterService = new TwitterService(brlBot)
