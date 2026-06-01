import { Request, Response } from "express"
import httpStatus from "http-status"
import { isFinnhubRateLimited, searchNews, NewsItem } from "../services/finnhub"
import { generateNewsComment } from "../services/replicate"
import { STOCKS, buildNewsMessage, formatDateYMD } from "../domain/stocks"
import { buildPostApiResponse, fanout, fanoutHadSuccess } from "../fanout"
import {
  errorMessage,
  logIntegrationError,
  respondInternalError,
  respondSocialPublishFailed,
  respondUpstreamUnavailable,
} from "../http/errors"
import { getSocialTargets } from "./targets"

/** 7d then 30d — skip 1d (usually empty). At most one call per ticker per window. */
const NEWS_LOOKBACK_DAYS = [7, 30] as const

type FindNewsOutcome =
  | { status: "found"; news: NewsItem }
  | { status: "empty" }
  | { status: "rate_limited" }
  | { status: "upstream_error" }

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

function shuffledStocks(): string[] {
  const symbols = [...STOCKS]
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[symbols[i], symbols[j]] = [symbols[j], symbols[i]]
  }
  return symbols
}

async function findRecentNews(now: Date): Promise<FindNewsOutcome> {
  const toDate = formatDateYMD(now)
  let hadSuccessfulCall = false
  let errorCount = 0

  for (const lookbackDays of NEWS_LOOKBACK_DAYS) {
    const fromDate = formatDateYMD(subtractDays(now, lookbackDays))

    for (const symbol of shuffledStocks()) {
      try {
        const items = await searchNews(symbol, fromDate, toDate)
        hadSuccessfulCall = true
        if (items.length > 0) {
          return {
            status: "found",
            news: items[Math.floor(Math.random() * items.length)],
          }
        }
      } catch (err) {
        if (isFinnhubRateLimited(err)) {
          logIntegrationError("news", "finnhub", err)
          return { status: "rate_limited" }
        }
        errorCount++
        logIntegrationError("news", "finnhub", err)
      }
    }

    console.warn(`[news] No articles for any ticker (${fromDate}..${toDate}, ${lookbackDays}d window)`)
  }

  if (!hadSuccessfulCall && errorCount > 0) {
    return { status: "upstream_error" }
  }
  return { status: "empty" }
}

/**
 * POST /urabot/news: picks recent uranium news, LLM comment, then posts.
 * `204` when no articles; `503`/`502`/`500` on integration failures.
 */
export async function postUraNews(_req: Request, res: Response): Promise<void> {
  const now = new Date()

  try {
    const outcome = await findRecentNews(now)

    if (outcome.status === "rate_limited") {
      respondUpstreamUnavailable(res, "finnhub", "Finnhub rate limit exceeded")
      return
    }
    if (outcome.status === "upstream_error") {
      respondUpstreamUnavailable(res, "finnhub", "Finnhub news API unavailable")
      return
    }
    if (outcome.status === "empty") {
      res.status(httpStatus.NO_CONTENT).send()
      return
    }

    const { news } = outcome
    let comment: string
    try {
      comment = await generateNewsComment(news)
    } catch (err) {
      logIntegrationError("news", "replicate", err)
      respondUpstreamUnavailable(res, "replicate", "Replicate comment generation failed")
      return
    }

    const message = buildNewsMessage(comment, news.url)
    const posts = await fanout(message, getSocialTargets())
    if (!fanoutHadSuccess(posts)) {
      respondSocialPublishFailed(res, posts)
      return
    }

    res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
  } catch (err) {
    logIntegrationError("news", "internal", err)
    respondInternalError(res, "internal", errorMessage(err))
  }
}
