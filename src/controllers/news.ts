import { Request, Response } from "express"
import httpStatus from "http-status"
import { searchNews, NewsItem } from "../services/finnhub"
import { generateNewsComment } from "../services/replicate"
import { STOCKS, buildNewsMessage, formatDateYMD } from "../domain/stocks"
import { buildPostApiResponse, fanout } from "../fanout"
import { getSocialTargets } from "./targets"

const MAX_ATTEMPTS_PER_WINDOW = STOCKS.length * 4

/** Finnhub often has no items in a 1-day window; widen until articles appear. */
const NEWS_LOOKBACK_DAYS = [1, 7, 30] as const

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

async function findRecentNews(now: Date): Promise<NewsItem | undefined> {
  const toDate = formatDateYMD(now)

  for (const lookbackDays of NEWS_LOOKBACK_DAYS) {
    const fromDate = formatDateYMD(subtractDays(now, lookbackDays))
    let attempts = 0

    while (attempts < MAX_ATTEMPTS_PER_WINDOW) {
      const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)]
      const items = await searchNews(symbol, fromDate, toDate).catch(err => {
        console.warn(`[news] Failed to fetch news for ${symbol}:`, (err as Error).message)
        return []
      })
      if (items.length > 0) {
        return items[Math.floor(Math.random() * items.length)]
      }
      attempts++
    }

    console.warn(
      `[news] No articles after ${MAX_ATTEMPTS_PER_WINDOW} tries (${fromDate}..${toDate}, ${lookbackDays}d window)`
    )
  }

  return undefined
}

/**
 * POST /urabot/news: picks recent uranium news, optional LLM comment, then posts.
 * Returns 204 when no article is found; 200 includes `tweet_id` when X succeeds.
 */
export async function postUraNews(_req: Request, res: Response): Promise<void> {
  const now = new Date()
  const news = await findRecentNews(now)

  if (!news) {
    console.warn("[news] No articles found after widening to 30-day lookback")
    res.status(httpStatus.NO_CONTENT).json({})
    return
  }

  let comment: string
  try {
    comment = await generateNewsComment({ headline: news.headline, summary: news.summary })
  } catch (err) {
    console.warn("[news] LLM failed, posting headline as fallback:", (err as Error).message)
    comment = news.headline
  }

  const message = buildNewsMessage(comment, news.url)
  const posts = await fanout(message, getSocialTargets())

  res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
}
