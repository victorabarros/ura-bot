import { Request, Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import { getQuote } from "../services/finnhub"
import { generateHolidayImage } from "../services/replicate"
import { getHolidayEntry } from "../domain/holidays"
import { getPostContext } from "../domain/context"
import { STOCKS, buildStockMessages, buildHolidayMessage } from "../domain/stocks"
import { buildPostApiResponse, fanoutAll, fanoutHadSuccess } from "../fanout"
import {
  ApiErrorBody,
  logIntegrationError,
  respondSocialPublishFailed,
} from "../http/errors"
import { getSocialTargets } from "./targets"

/**
 * POST /urabot/stocks: holiday message or uranium quote roundup.
 * `503`/`502`/`500` on integration failures; partial quote misses are OK.
 */
export async function postUraStock(_req: Request, res: Response): Promise<void> {
  const now = new Date()

  try {
    const ctx = getPostContext(now)

    const entry = await getHolidayEntry(now)
    if (entry) {
        const imageUrl = await generateHolidayImage(entry.eventName).catch((err: unknown) => {
          console.warn("[stocks] Holiday image generation failed:", err instanceof Error ? err.message : String(err))
          return undefined
        })
        const message = buildHolidayMessage(entry.eventName, entry.message, now, ctx, imageUrl)
        const posts = await fanoutAll([message], getSocialTargets())
        const flat = posts.flat()
        if (!fanoutHadSuccess(posts)) {
          respondSocialPublishFailed(res, flat)
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
    const posts = await fanoutAll(messages, getSocialTargets())
    const flat = posts.flat()
    if (!fanoutHadSuccess(posts)) {
      respondSocialPublishFailed(res, flat)
      return
    }

    res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
  } catch (err) {
    logIntegrationError("stocks", "internal", err)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err instanceof Error ? err.message : String(err), integration: "internal" } satisfies ApiErrorBody)
  }
}
