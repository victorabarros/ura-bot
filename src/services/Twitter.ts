import request from "request"
import config from "../config"

const { uraBot, brlBot } = config.twitter

type WriteTweetResponse = {
  id: string
}

interface ITwitterService {
  writeTweet(message: string): Promise<WriteTweetResponse>
  check(): Promise<void>
}

class TwitterService implements ITwitterService {
  private oauth: any

  constructor(props: any) {
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
      url: "https://api.twitter.com/2/tweets",//todo "https://api.twitter.com" move to config
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
    const options = {
      method: "POST",
      url: "https://api.twitter.com/oauth/request_token",
      headers: {
        "Content-Type": "application/json",
      },
      oauth: this.oauth,
      body: JSON.stringify({})
    }

    request(options, function (error, response, body) {
      if (error) throw new Error(error)
    })

    return Promise.resolve()
  }
}


export const UraTwitterService = new TwitterService({ ...uraBot })


export const BrlTwitterService = new TwitterService(brlBot)
