import { Request, Response } from "express"
import httpStatus from "http-status"
import { uraBotXService } from "../services/x"
import { logIntegrationError } from "../http/errors"
import { ApiErrorBody } from "../http/errors"

/** GET /urabot/latest-post — returns the bot's most recent X post. */
export async function getLatestUraPost(_req: Request, res: Response): Promise<void> {
  try {
    const post = await uraBotXService.getLatestPost()
    res.status(httpStatus.OK).json(post)
  } catch (err) {
    logIntegrationError("latest-post", "x", err)
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      error: err instanceof Error ? err.message : "Failed to fetch latest post",
      integration: "x",
    } satisfies ApiErrorBody)
  }
}
