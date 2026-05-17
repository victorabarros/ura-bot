import { ISocialService, PostMessageResponse } from "./ISocialService"

type XSocialServiceProps = {
  clientId: string
  clientSecret: string
  accessToken: string
  refreshToken: string
}

export class XSocialService implements ISocialService {

  private clientId: string
  private clientSecret: string
  private accessToken: string
  private refreshToken: string

  constructor(props: XSocialServiceProps) {
    this.clientId= props.clientId
    this.clientSecret= props.clientSecret
    this.accessToken= props.accessToken
    this.refreshToken= props.refreshToken
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    return { id: "TODO" }
  }
}
