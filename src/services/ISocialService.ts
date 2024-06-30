export type PostMessageResponse = {
  id: string
}

export interface ISocialService {
  postMessage(message: string): Promise<PostMessageResponse>
  check(): Promise<boolean>
}
