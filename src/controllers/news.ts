import { Request, Response } from "express"
import httpStatus from "http-status"
import { isFinnhubRateLimited, searchNews, NewsItem } from "../services/finnhub"
import { generateNewsComment } from "../services/replicate"
import { STOCKS, buildNewsMessage, formatDateYMD } from "../domain/stocks"
import { buildPostApiResponse, fanout } from "../fanout"
import { getSocialTargets } from "./targets"

/** 7d then 30d — skip 1d (usually empty). At most one call per ticker per window. */
const NEWS_LOOKBACK_DAYS = [7, 30] as const

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

async function findRecentNews(now: Date): Promise<NewsItem | undefined> {
  const toDate = formatDateYMD(now)

  for (const lookbackDays of NEWS_LOOKBACK_DAYS) {
    const fromDate = formatDateYMD(subtractDays(now, lookbackDays))

    for (const symbol of shuffledStocks()) {
      try {
        const items = await searchNews(symbol, fromDate, toDate)
        if (items.length > 0) {
          return items[Math.floor(Math.random() * items.length)]
        }
      } catch (err) {
        if (isFinnhubRateLimited(err)) {
          console.warn("[news] Finnhub rate limited; stopping further news lookups")
          return undefined
        }
        console.warn(`[news] Failed to fetch news for ${symbol}:`, (err as Error).message)
      }
    }

    console.warn(`[news] No articles for any ticker (${fromDate}..${toDate}, ${lookbackDays}d window)`)
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
    console.warn("[news] No articles found (or Finnhub rate limited)")
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
