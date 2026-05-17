export type XSocialServiceProps = {
  clientId: string
  clientSecret: string
  accessToken: string
  refreshToken: string
}

export type CreateTweetResponse = {
  data: {
    id: string
  }
}

export type RefreshTokenResponse = {
  access_token: string
  refresh_token?: string
}
