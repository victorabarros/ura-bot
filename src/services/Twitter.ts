import request, { OAuthOptions } from "request"
import config from "../config"
import { ISocialService, PostMessageResponse } from "./ISocialService"

const { baseUrl } = config.twitter

type TwitterServiceProps = {
  apiKey: string
  apiKeySecret: string
  accessToken: string
  accessTokenSecret: string
}

export class TwitterService implements ISocialService {
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
      body: JSON.stringify({ "text": message.trim() }),
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
    })

    return { id: "TODO" }
  }

}
