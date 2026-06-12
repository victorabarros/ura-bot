import { Request, Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import { getQuote } from "../services/finnhub"
import { generateComment, generateImage } from "../services/replicate"
import { getHolidayEntry } from "../domain/holidays"
import { getPostContext } from "../domain/marketTime"
import { STOCKS, buildStockMessages, buildHolidayMessage } from "../domain/stocks"
import { buildPostApiResponse, fanoutAll, fanoutHadSuccess } from "../domain/fanout"
import {
  ApiErrorBody,
  logIntegrationError,
  respondSocialPublishFailed,
} from "../http/errors"
import { SOCIAL_TARGETS } from "./targets"

/**
 * POST /urabot/stocks: holiday message or uranium quote roundup.
 * `503`/`502`/`500` on integration failures; partial quote misses are OK.
 */
export const postUraStock = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date()

  try {
    const ctx = getPostContext(now)

    const entry = await getHolidayEntry(now)
    if (entry) {
      const [imgResult, commentResult] = await Promise.allSettled([
        generateImage(`Festive ${entry.eventName} ${now.getFullYear()} celebration, nuclear energy and uranium market theme, dynamic digital art, vivid colors, high quality`),
        entry.message
          ? Promise.resolve(undefined)
          : generateComment(`Write a short post (up to 150 characters) wishing happy ${entry.eventName} ${now.getFullYear()} to uranium investors (don't use hashtag with uranium word)`),
      ])

      const imageUrl = imgResult.status === "fulfilled"
        ? imgResult.value
        : (console.warn("[stocks] Holiday image generation failed:", imgResult.reason instanceof Error ? imgResult.reason.message : String(imgResult.reason)), undefined)

      const holidayMessage = commentResult.status === "fulfilled"
        ? commentResult.value
        : (console.warn("[stocks] Holiday comment generation failed:", commentResult.reason instanceof Error ? commentResult.reason.message : String(commentResult.reason)), undefined)

      const message = buildHolidayMessage(entry.eventName, entry.message ?? holidayMessage, now, ctx)
      const posts = await fanoutAll([message], SOCIAL_TARGETS, imageUrl)
      if (!fanoutHadSuccess(posts)) {
        respondSocialPublishFailed(res, posts)
        return
      }
      res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
      return
    }

    const quoteResults = await Promise.allSettled(STOCKS.map((symbol) => getQuote(symbol)))

    const quotes = quoteResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getQuote>>> => r.status === "fulfilled")
      .map((r) => r.value)

    const rejected = quoteResults.filter((r): r is PromiseRejectedResult => r.status === "rejected")

    rejected.forEach((r) => logIntegrationError("stocks", "finnhub", r.reason))

    if (quotes.length === 0) {
      const allRateLimited =
        rejected.length > 0 && rejected.every((r) => axios.isAxiosError(r.reason) && r.reason?.response?.status === 429)
      if (allRateLimited) {
        res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Finnhub rate limit exceeded", integration: "finnhub" } satisfies ApiErrorBody)
        return
      }
      if (rejected.length === STOCKS.length) {
        res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Finnhub quote API unavailable", integration: "finnhub" } satisfies ApiErrorBody)
        return
      }
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "No quotes available", integration: "finnhub" } satisfies ApiErrorBody)
      return
    }

    const messages = buildStockMessages(quotes, now, ctx)
    const posts = await fanoutAll(messages, SOCIAL_TARGETS)
    if (!fanoutHadSuccess(posts)) {
      respondSocialPublishFailed(res, posts)
      return
    }

    res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
  } catch (err) {
    logIntegrationError("stocks", "internal", err)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err instanceof Error ? err.message : String(err), integration: "internal" } satisfies ApiErrorBody)
  }
}
