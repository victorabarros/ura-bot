import { ISocialService, PostMessageResponse } from "./ISocialService"

// TODO xSocial ura
type XSocialServiceProps = Record<string, never>

export class XSocialService implements ISocialService {
  constructor(props: XSocialServiceProps) {
    // TODO xSocial ura
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    // TODO xSocial ura
    return { id: "TODO xSocial ura" }
  }
}
