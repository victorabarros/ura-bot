import { Request, Response } from "express"
import httpStatus from "http-status"
import { getQuote } from "../services/finnhub"
import { isHoliday, getHolidayEntry } from "../domain/holidays"
import { getPostContext } from "../domain/context"
import { STOCKS, buildStockMessages, buildHolidayMessage } from "../domain/stocks"
import { buildPostApiResponse, fanoutAll } from "../fanout"
import { getSocialTargets } from "./targets"

/**
 * POST /urabot/stocks: holiday message or uranium quote roundup.
 * Fans out to all social targets; 200 includes X `tweet_id` or `tweet_ids`.
 */
export async function postUraStock(req: Request, res: Response): Promise<void> {
  const now = new Date()
  const ctx = getPostContext(now)

  if (await isHoliday(now)) {
    const entry = await getHolidayEntry(now)
    if (entry) {
      const message = buildHolidayMessage(entry.eventName, entry.message, now, ctx)
      const posts = await fanoutAll([message], getSocialTargets())
      res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
      return
    }
  }

  const quoteResults = await Promise.allSettled(
    STOCKS.map(symbol => getQuote(symbol))
  )

  const quotes = quoteResults
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof getQuote>>> => r.status === "fulfilled")
    .map(r => r.value)

  quoteResults
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .forEach(r => console.warn("[stocks] Failed to fetch quote:", r.reason))

  if (quotes.length === 0) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "No quotes available" })
    return
  }

  const messages = buildStockMessages(quotes, now, ctx)
  const posts = await fanoutAll(messages, getSocialTargets())

  res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
}
