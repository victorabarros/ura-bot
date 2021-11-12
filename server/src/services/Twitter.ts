import { response } from "express"
import Twitter from "twitter-lite"
import config from "../../config"

const { apiKey, apiKeySecret, accessToken, accessTokenSecret } = config.twitter

interface IWriteTwitResponse {
  id: string
}

interface ITwitterService {
  writeTwit(message: string): Promise<IWriteTwitResponse>
  check(): Promise<boolean>
}

const client = new Twitter({
  consumer_key: apiKey,
  consumer_secret: apiKeySecret,
  access_token_key: accessToken,
  access_token_secret: accessTokenSecret
})

class TwitterService implements ITwitterService {
  async writeTwit(message: string): Promise<IWriteTwitResponse> {
    const { id_str } = await client.post("statuses/update", { status: message })
    return { id: id_str }
  }

  async check(): Promise<boolean> {
    return client.getBearerToken()
      .then(() => true)
      .catch(resp => {
        console.log(resp)
        return false
      })
  }
}

export default TwitterService
