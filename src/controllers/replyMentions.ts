import { Request, Response } from "express"
import httpStatus from "http-status"
import { generateComment } from "../services/replicate"
import { uraBotXService } from "../services/x"
import { ApiErrorBody, logIntegrationError } from "../http/errors"

const MENTIONS_WINDOW_MS = 5 * 60 * 1000

type RepliedItem = { mention_id: string; reply_id: string }
type FailedItem = { mention_id: string; error: string }

/**
 * POST /urabot/reply-mentions: fetches X mentions from the last 5 minutes,
 * generates an LLM reply for each via Replicate, and posts threaded replies.
 * Fail-soft per mention — one failure does not stop the others.
 * `204` when no recent mentions; `503` when X API is unavailable.
 */
export const replyToMentions = async (_req: Request, res: Response): Promise<void> => {
  const sinceTime = new Date(Date.now() - MENTIONS_WINDOW_MS)

  let mentions
  try {
    mentions = await uraBotXService.getMentions(100, sinceTime)
  } catch (err) {
    logIntegrationError("reply-mentions", "x", err)
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "X mentions API unavailable", integration: "x" } satisfies ApiErrorBody)
    return
  }

  if (mentions.length === 0) {
    res.status(httpStatus.NO_CONTENT).send()
    return
  }

  const replied: RepliedItem[] = []
  const failed: FailedItem[] = []

  const results = await Promise.allSettled(
    mentions.map(async (mention) => {
      let reply: string
      try {
        reply = await generateComment(
          `Reply in 200 characters or less to this X mention in the uranium market context: "${mention.text}"`
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[reply-mentions] Replicate failed for mention ${mention.id}:`, message)
        failed.push({ mention_id: mention.id, error: `replicate: ${message}` })
        return
      }

      try {
        const { id: replyId } = await uraBotXService.replyToPost(reply, mention.id)
        replied.push({ mention_id: mention.id, reply_id: replyId })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(`[reply-mentions] X reply failed for mention ${mention.id}:`, message)
        failed.push({ mention_id: mention.id, error: `x: ${message}` })
      }
    })
  )

  const unexpectedError = results.find(r => r.status === "rejected")
  if (unexpectedError) {
    logIntegrationError("reply-mentions", "internal", (unexpectedError as PromiseRejectedResult).reason)
  }

  res.status(httpStatus.OK).json({ replied, failed })
}
