import { Request, Response } from "express"
import httpStatus from "http-status"
import { searchNews, NewsItem } from "../services/finnhub"
import { generateNewsComment } from "../services/replicate"
import { STOCKS, buildNewsMessage, formatDateYMD } from "../domain/stocks"
import { buildPostApiResponse, fanout } from "../fanout"
import { getSocialTargets } from "./targets"

const MAX_ATTEMPTS = STOCKS.length * 4

/**
 * POST /urabot/news: picks recent uranium news, optional LLM comment, then posts.
 * Returns 204 when no article is found; 200 includes `tweet_id` when X succeeds.
 */
export async function postUraNews(_req: Request, res: Response): Promise<void> {
  const now = new Date()
  const toDate = formatDateYMD(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const fromDate = formatDateYMD(yesterday)

  let news: NewsItem | undefined
  let attempts = 0

  while (!news && attempts < MAX_ATTEMPTS) {
    const symbol = STOCKS[Math.floor(Math.random() * STOCKS.length)]
    const items = await searchNews(symbol, fromDate, toDate).catch(err => {
      console.warn(`[news] Failed to fetch news for ${symbol}:`, (err as Error).message)
      return []
    })
    if (items.length > 0) {
      news = items[Math.floor(Math.random() * items.length)]
    }
    attempts++
  }

  if (!news) {
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
