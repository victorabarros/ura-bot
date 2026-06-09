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

  /**
   * Publishes a message with an attached image.
   * Downloads the image from `imageUrl`, uploads it to the platform, and
   * attaches it to the post. Falls back to `postMessage` if not implemented.
   * Throws on failure (fan-out catches per target).
   */
  postWithImage?(message: string, imageUrl: string): Promise<PostMessageResponse>
}
