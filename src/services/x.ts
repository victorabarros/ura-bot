import axios, { AxiosError } from "axios"
import { ISocialService, PostMessageResponse } from "./ISocialService"
import { cacheGet, cacheSet } from "../cache"
import config from "../config"

const BASE_URL = "https://api.x.com/2"
const ACCESS_TOKEN_KEY = "x_access_token"
const REFRESH_TOKEN_KEY = "x_refresh_token"
const TOKEN_TTL = 60 * 60 * 2 // 2 hours

type CreateTweetResponse = {
  data: { id: string; text: string }
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export class XService implements ISocialService {
  private accessToken: string
  private refreshToken: string

  constructor() {
    this.accessToken = config.x.accessToken
    this.refreshToken = config.x.refreshToken
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("X: message cannot be empty")

    await this.loadCachedTokens()

    return this.withTokenRefresh(() => this.createTweet(text))
  }

  private async createTweet(text: string): Promise<PostMessageResponse> {
    const response = await axios.post<CreateTweetResponse>(
      `${BASE_URL}/tweets`,
      { text },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )
    return { id: response.data.data.id }
  }

  private async withTokenRefresh<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (err) {
      if (this.isUnauthorized(err)) {
        await this.doRefresh()
        return request()
      }
      throw err
    }
  }

  private async doRefresh(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    })

    const response = await axios.post<TokenResponse>(
      `${BASE_URL}/oauth2/token`,
      body.toString(),
      {
        auth: { username: config.x.clientId, password: config.x.clientSecret },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    )

    this.accessToken = response.data.access_token
    this.refreshToken = response.data.refresh_token

    await cacheSet(ACCESS_TOKEN_KEY, this.accessToken, TOKEN_TTL)
    await cacheSet(REFRESH_TOKEN_KEY, this.refreshToken, TOKEN_TTL)

    console.log("[x] Tokens refreshed and persisted to cache")
  }

  private async loadCachedTokens(): Promise<void> {
    const [cachedAccess, cachedRefresh] = await Promise.all([
      cacheGet(ACCESS_TOKEN_KEY),
      cacheGet(REFRESH_TOKEN_KEY),
    ])
    if (cachedAccess) this.accessToken = cachedAccess
    if (cachedRefresh) this.refreshToken = cachedRefresh
  }

  private isUnauthorized(err: unknown): err is AxiosError {
    return axios.isAxiosError(err) && err.response?.status === 401
  }
}
