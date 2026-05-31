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
        const error = err instanceof Error ? err.message : String(err)
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
