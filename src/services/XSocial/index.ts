import axios, { AxiosError } from "axios"
import { ISocialService, PostMessageResponse } from "../ISocialService"
import { XSocialServiceProps, CreateTweetResponse, RefreshTokenResponse } from "./types"

const BASE_URL = "https://api.x.com/2"

export class XSocialService implements ISocialService {

  private clientId: string
  private clientSecret: string
  private accessToken: string
  private refreshToken: string
  private onRefreshToken: (token: string) => Promise<void>

  constructor(props: XSocialServiceProps) {
    this.clientId= props.clientId
    this.clientSecret= props.clientSecret
    this.accessToken= props.accessToken
    this.refreshToken= props.refreshToken
    this.onRefreshToken= props.onRefreshToken
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()

    if (!text) throw new Error("X post message cannot be empty")

    const {id} = await this.withRefreshedTokenRetry(async () => {
      const response = await axios.post<CreateTweetResponse>(
        `${BASE_URL}/tweets`,
        { text },
        {
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      return { id: response.data.data.id }
    })

    return {id}
  }

  private async withRefreshedTokenRetry<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request()
    } catch (error) {
      if (this.isUnauthorizedError(error)) {
        await this.refreshToken()
        return await request()
      }

        throw error
    }
  }

  private async refreshToken(): Promise<void> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    })

    const response = await axios.post<RefreshTokenResponse>(
      `${BASE_URL}/oauth2/token`,
      body.toString(),
      {
        auth: {
          username: this.clientId,
          password: this.clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    this.accessToken = response.data.access_token
    this.refreshToken = response.data.refresh_token
    await this.onRefreshToken({accessToken: response.data.access_token, refreshToken: response.data.refresh_token})
  }

  private isUnauthorizedError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error) && error.response?.status === 401
  }
}
