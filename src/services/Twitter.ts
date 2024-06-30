import request, { OAuthOptions } from "request"
import config from "../config"
import { ISocialService, PostMessageResponse } from "./ISocialService"

const { uraBot, brlBot, baseUrl } = config.twitter

type TwitterServiceProps = {
  apiKey: string
  apiKeySecret: string
  accessToken: string
  accessTokenSecret: string
}

class TwitterService implements ISocialService {
  private oauth: OAuthOptions

  constructor(props: TwitterServiceProps) {
    this.oauth = {
      consumer_key: props.apiKey,
      consumer_secret: props.apiKeySecret,
      token: props.accessToken,
      token_secret: props.accessTokenSecret,
    }
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
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

    return { id: "TODO" }
  }

  check(): Promise<boolean> {
    // throw new Error("Method not implemented.")
    return Promise.resolve(true)
  }
}


export const UraTwitterService = new TwitterService({ ...uraBot })


export const BrlTwitterService = new TwitterService(brlBot)
