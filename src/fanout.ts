import { ISocialService, PostMessageResponse } from "./services/ISocialService"

/** Per-platform outcome after attempting one post. */
export type FanoutResult = {
  platform: string
  success: boolean
  id?: string
  error?: string
}

/**
 * Posts one message to every target in parallel.
 * Each target succeeds or fails independently.
 */
export async function fanout(
  message: string,
  targets: { name: string; service: ISocialService }[]
): Promise<FanoutResult[]> {
  const tasks = targets.map(({ name, service }) =>
    service
      .postMessage(message)
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
  )

  return Promise.all(tasks)
}

/**
 * Posts multiple messages sequentially, fanning out each one.
 * Used when stock roundups exceed one social post.
 */
export async function fanoutAll(
  messages: string[],
  targets: { name: string; service: ISocialService }[]
): Promise<FanoutResult[][]> {
  const results: FanoutResult[][] = []
  for (const message of messages) {
    results.push(await fanout(message, targets))
  }
  return results
}
