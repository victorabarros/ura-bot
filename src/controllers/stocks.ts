import { Request, Response } from "express"
import httpStatus from "http-status"
import { getQuote, isFinnhubRateLimited } from "../services/finnhub"
import { isHoliday, getHolidayEntry } from "../domain/holidays"
import { getPostContext } from "../domain/context"
import { STOCKS, buildStockMessages, buildHolidayMessage } from "../domain/stocks"
import { buildPostApiResponse, fanoutAll, fanoutHadSuccess } from "../fanout"
import {
  errorMessage,
  logIntegrationError,
  respondInternalError,
  respondSocialPublishFailed,
  respondUpstreamUnavailable,
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

    if (await isHoliday(now)) {
      const entry = await getHolidayEntry(now)
      if (entry) {
        const message = buildHolidayMessage(entry.eventName, entry.message, now, ctx)
        const posts = await fanoutAll([message], getSocialTargets())
        const flat = posts.flat()
        if (!fanoutHadSuccess(posts)) {
          respondSocialPublishFailed(res, flat)
          return
        }
        res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
        return
      }
    }

    const quoteResults = await Promise.allSettled(STOCKS.map((symbol) => getQuote(symbol)))

    const quotes = quoteResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getQuote>>> => r.status === "fulfilled")
      .map((r) => r.value)

    const rejected = quoteResults.filter((r): r is PromiseRejectedResult => r.status === "rejected")

    rejected.forEach((r) => logIntegrationError("stocks", "finnhub", r.reason))

    if (quotes.length === 0) {
      const allRateLimited =
        rejected.length > 0 && rejected.every((r) => isFinnhubRateLimited(r.reason))
      if (allRateLimited) {
        respondUpstreamUnavailable(res, "finnhub", "Finnhub rate limit exceeded")
        return
      }
      if (rejected.length === STOCKS.length) {
        respondUpstreamUnavailable(res, "finnhub", "Finnhub quote API unavailable")
        return
      }
      respondInternalError(res, "finnhub", "No quotes available")
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
    respondInternalError(res, "internal", errorMessage(err))
  }
}
