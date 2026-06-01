/** Platform-assigned id for a published post. */
export type PostMessageResponse = {
  id: string
}

/** Contract for outbound social posting; one implementation per platform. */
export interface ISocialService {
  /**
   * Publishes plain text; must return the real post id.
   * Throws on failure (fan-out catches per target).
   */
  postMessage(message: string): Promise<PostMessageResponse>
}
