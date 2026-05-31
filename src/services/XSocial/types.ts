export type XSocialServiceProps = {
  clientId: string
  clientSecret: string
  accessToken: string
  refreshToken: string
  onRefreshToken: (token: {accessToken: string, refreshToken: string}) => Promise<void>
}

export type CreateTweetResponse = {
  data: {
    id: string
  }
}

export type RefreshTokenResponse = {
  access_token: string
  refresh_token: string
}
