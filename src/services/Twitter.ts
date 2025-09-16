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
    // TODO use "twitter-api-v2": "^1.18.2", instead
    // like https://github.com/EnesCinr/twitter-mcp/blob/56f3e4df00ffd4f6a682771265b6e666d031f236/src/twitter-api.ts#L1
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
