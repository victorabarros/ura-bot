import { Request, Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import moment from "moment-timezone"
import { searchNews, NewsItem } from "../services/finnhub"
import { generateComment, generateImage } from "../services/replicate"
import { STOCKS } from "../domain/stocks"
import { buildPostApiResponse, fanout } from "../domain/fanout"
import {
  ApiErrorBody,
  logIntegrationError,
  respondSocialPublishFailed,
} from "../http/errors"
import { SOCIAL_TARGETS } from "./targets"

const MARKET_TZ = "America/New_York"

/** Rotated per post so the feed doesn't converge on one look. */
const IMAGE_STYLES = [
  "retro-futurist propaganda poster, bold flat shapes, screen-print texture, high contrast",
  "surreal photorealistic render, extreme macro perspective, shallow depth of field",
  "moody cinematic concept art, anamorphic lens flare, volumetric haze, monumental scale",
  "award-winning documentary photograph, golden-hour light, telephoto compression",
  "dark sci-fi matte painting, vast landscape, a tiny lone human silhouette for scale",
] as const

/** 7d then 30d — skip 1d (usually empty). At most one call per ticker per window. */
const NEWS_LOOKBACK_DAYS = [7, 30] as const

/** Collapses whitespace, trims, and truncates with "..." at `max` chars. */
const tidy = (text: string, max: number): string => {
  const collapsed = text.replace(/\s+/g, " ").trim()
  return collapsed.length <= max ? collapsed : collapsed.slice(0, max - 3).trimEnd() + "..."
}

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
        `Write one concrete uranium-market takeaway in 100 characters or less. No hashtags, no links, no incomplete sentence. News: ${JSON.stringify(news)}`
      )
    } catch (err) {
      logIntegrationError("news", "replicate", err)
      res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: "Replicate comment generation failed", integration: "replicate" } satisfies ApiErrorBody)
      return
    }

    let imageUrl: string | undefined
    try {
      const style = IMAGE_STYLES[Math.floor(Math.random() * IMAGE_STYLES.length)]
      imageUrl = await generateImage(
        `Scroll-stopping editorial hero image for a uranium market news story. Headline: "${news.headline}". Context: ${news.summary}. Company or ticker: ${news.related}. Invent ONE bold visual metaphor that captures what this specific story means — its tension, stakes, or irony — rather than illustrating the industry literally. Composition: a single dominant focal subject, unusual or extreme camera angle, strong silhouette that reads instantly even as a small phone thumbnail. Style: ${style}. Color: one electric accent (radioactive green, uranium-glass teal, or warning orange) against an otherwise restrained palette. Strictly avoid cliches: no miners with headlamps, no glowing crystal caves, no cooling towers, no generic mine tunnels. Absolutely no text, letters, numbers, charts, graphs, logos, or watermarks anywhere in the image.`
      )
    } catch (err) {
      console.warn("[news] Image generation failed, posting without image:", (err as Error).message)
    }

    const headline = tidy(news.headline, 80)
    const takeaway = tidy(comment, 100)
    const message = [`Uranium watch: ${headline}`, "", takeaway, "", "#Uranium☢️"].join("\n")
    const posts = await fanout(message, SOCIAL_TARGETS, imageUrl)
    if (!posts.some((r) => r.success)) {
      respondSocialPublishFailed(res, posts)
      return
    }

    res.status(httpStatus.OK).json(buildPostApiResponse(now, posts))
  } catch (err) {
    logIntegrationError("news", "internal", err)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: err instanceof Error ? err.message : String(err), integration: "internal" } satisfies ApiErrorBody)
  }
}
