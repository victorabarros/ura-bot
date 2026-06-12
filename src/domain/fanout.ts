import { ISocialService, PostMessageResponse } from "../services/ISocialService"

/** Per-platform outcome after attempting one post. */
export type FanoutResult = {
  platform: string
  success: boolean
  id?: string
  error?: string
}

/** JSON body for POST /urabot/stocks and POST /urabot/news success responses. */
export type PostApiResponse = {
  created_at: Date
  tweet_id?: string
  tweet_ids?: string[]
}

const X_PLATFORM = "X"


/**
 * Builds the success response payload with X tweet id(s) from fan-out.
 * One id uses `tweet_id`; multiple chunked posts use `tweet_ids`.
 */
export const buildPostApiResponse = (createdAt: Date, results: FanoutResult[]): PostApiResponse => {
  const ids = results
    .filter((r) => r.platform === X_PLATFORM && r.success && r.id)
    .map((r) => r.id!)

  const body: PostApiResponse = { created_at: createdAt }
  if (ids.length === 1) body.tweet_id = ids[0]
  else if (ids.length > 1) body.tweet_ids = ids
  return body
}

/**
 * Posts one message to every target in parallel.
 * When `imageUrl` is provided and the target implements `postWithImage`, the
 * image is uploaded and attached; otherwise falls back to plain `postMessage`.
 * Each target succeeds or fails independently.
 */
export const fanout = async (
  message: string,
  targets: { name: string; service: ISocialService }[],
  imageUrl?: string,
): Promise<FanoutResult[]> => {
  const tasks = targets.map(({ name, service }) => {
    const post = imageUrl && service.postWithImage
      ? service.postWithImage(message, imageUrl)
      : service.postMessage(message)

    return post
      .then((res: PostMessageResponse) => {
        console.log(`[fanout] ${name} posted id=${res.id}`)
        return { platform: name, success: true, id: res.id }
      })
      .catch((err: unknown) => {
        let error = err instanceof Error ? err.message : String(err)
        // twitter-api-v2 attaches the API error body on err.data
        if (err && typeof err === "object") {
          const detail = ("data" in err ? err.data : null)
            ?? ("response" in (err as { response?: { data?: unknown } })
              ? (err as { response?: { data?: unknown } }).response?.data
              : null)
          if (detail) error += ` — ${JSON.stringify(detail)}`
        }
        console.error(`[fanout] ${name} failed: ${error}`)
        return { platform: name, success: false, error }
      })
  })

  return (await Promise.allSettled(tasks)).map((r) =>
    r.status === "fulfilled" ? r.value : { platform: "unknown", success: false, error: String(r.reason) }
  )
}

/**
 * Posts multiple messages in parallel, fanning out each one.
 * Used when stock roundups exceed one social post.
 * `imageUrl`, when provided, is attached only to the first message.
 */
export const fanoutAll = async (
  messages: string[],
  targets: { name: string; service: ISocialService }[],
  imageUrl?: string,
): Promise<FanoutResult[]> => {
  const settled = await Promise.allSettled(
    messages.map((msg, i) => fanout(msg, targets, i === 0 ? imageUrl : undefined))
  )
  return settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []))
}
