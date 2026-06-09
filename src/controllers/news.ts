import { Request, Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import moment from "moment-timezone"
import { searchNews, NewsItem } from "../services/finnhub"
import { generateComment, generateImage } from "../services/replicate"
import { STOCKS } from "../domain/stocks"
import { buildPostApiResponse, fanout, fanoutHadSuccess } from "../fanout"
import {
  ApiErrorBody,
  logIntegrationError,
  respondSocialPublishFailed,
} from "../http/errors"
import { SOCIAL_TARGETS } from "./targets"

const MARKET_TZ = "America/New_York"

/** 7d then 30d — skip 1d (usually empty). At most one call per ticker per window. */
const NEWS_LOOKBACK_DAYS = [7, 30] as const

type FindNewsOutcome =
  | { status: "found"; news: NewsItem }
  | { status: "empty" }
  | { status: "rate_limited" }
  | { status: "upstream_error" }

const shuffledStocks = (): string[] => {
  const symbols = [...STOCKS]
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[symbols[i], symbols[j]] = [symbols[j], symbols[i]]
  }
  return symbols
}

const findRecentNews = async (now: Date): Promise<FindNewsOutcome> => {
  const toDate = moment(now).tz(MARKET_TZ).format("YYYY-MM-DD")
  let hadSuccessfulCall = false
  let errorCount = 0

  for (const lookbackDays of NEWS_LOOKBACK_DAYS) {
    const fromDateObj = new Date(now)
    fromDateObj.setDate(fromDateObj.getDate() - lookbackDays)
    const fromDate = moment(fromDateObj).tz(MARKET_TZ).format("YYYY-MM-DD")

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
        if (axios.isAxiosError(err) && err.response?.status === 429) {
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
export const postUraNews = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date()

  try {
    const outcome = await findRecentNews(now)

    if (outcome.status === "rate_limited") {
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Finnhub rate limit exceeded", integration: "finnhub" } satisfies ApiErrorBody)
      return
    }
    if (outcome.status === "upstream_error") {
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Finnhub news API unavailable", integration: "finnhub" } satisfies ApiErrorBody)
      return
    }
    if (outcome.status === "empty") {
      res.status(httpStatus.NO_CONTENT).send()
      return
    }

    const { news } = outcome
    let comment: string
    try {
      comment = await generateComment(
        `Write a post (up to 150 characters) about the news (don't use hashtag with uranium word): ${JSON.stringify(news)}`
      )
    } catch (err) {
      logIntegrationError("news", "replicate", err)
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Replicate comment generation failed", integration: "replicate" } satisfies ApiErrorBody)
      return
    }

    /** 20% of the time, generate a satirical illustration to attach to the post. */
    let imageUrl: string | undefined
    if (Math.random() < 0.2) {
      try {
        imageUrl = await generateImage(
          `Satirical editorial cartoon inspired by this uranium market headline: "${news.headline}". Bold colors, dramatic lighting, fun and irreverent tone, no text or words in image, high quality illustration`
        )
      } catch (err) {
        console.warn("[news] Image generation failed, posting without image:", (err as Error).message)
      }
    }

    const message = [comment, "", "#Uranium☢️", news.url].join("\n")
    const posts = await fanout(message, SOCIAL_TARGETS, imageUrl)
    if (!fanoutHadSuccess(posts)) {
      respondSocialPublishFailed(res, posts)
      return
    }

    res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
  } catch (err) {
    logIntegrationError("news", "internal", err)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err instanceof Error ? err.message : String(err), integration: "internal" } satisfies ApiErrorBody)
  }
}
