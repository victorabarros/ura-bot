import { Quote } from "../services/finnhub"

/** Uranium-related tickers fetched for quotes and news sampling. */
export const STOCKS = [
  "CCJ",   // Cameco — second-largest producer in the world
  "DNN",   // Denison Mines
  "NXE",   // NexGen Energy
  "SMR",   // NuScale Power Corporation
  "SRUUF", // Sprott Physical Uranium Trust
  "UEC",   // Uranium Energy Corp
  "URA",   // Global X Uranium ETF
  "URNM",  // Sprott Uranium Miners ETF
  "UUUU",  // Energy Fuels
  "URNJ",  // Sprott Junior Uranium Miners ETF
  "UROY",  // Uranium Royalty Corp
]

/** Max tickers per social post before chunking. */
export const MAX_STOCKS_PER_MESSAGE = 6

const MARKET_TZ = "America/New_York"
const TIME_FORMAT = { timeZone: MARKET_TZ, hour: "2-digit", minute: "2-digit", hour12: false } as const

/** One ticker line with price, day change %, and direction emoji. */
export function formatQuoteLine(quote: Quote): string {
  const ticker = quote.symbol.padEnd(7)
  const delta = quote.openPrice > 0
    ? ((quote.price - quote.openPrice) / quote.openPrice) * 100
    : 0
  const sign = delta >= 0 ? "+" : ""
  const arrow = delta >= 0 ? "📈" : "📉"
  return `${ticker} ${quote.price.toFixed(2)} ${sign}${delta.toFixed(2)}% ${arrow}`
}

/** Market-local timestamp footer and uranium hashtag. */
export function buildSignature(now: Date): string {
  const time = now.toLocaleString("en-US", TIME_FORMAT)
  return `${time} ${MARKET_TZ}\n#Uranium☢️`
}

/**
 * Builds one or more stock roundup messages chunked by ticker count.
 * Adds morning/evening copy from post context on first/last chunk.
 */
export function buildStockMessages(quotes: Quote[], now: Date, ctx: PostContext): string[] {
  const messages: string[] = []

  for (let i = 0; i < quotes.length; i += MAX_STOCKS_PER_MESSAGE) {
    const chunk = quotes.slice(i, i + MAX_STOCKS_PER_MESSAGE)
    const parts: string[] = []

    if (i === 0 && ctx.isMorning) parts.push("Good Morning, everyone!")

    parts.push(chunk.map(formatQuoteLine).join("\n"))
    parts.push(buildSignature(now))

    if (i + MAX_STOCKS_PER_MESSAGE >= quotes.length && ctx.isEvening) {
      const weekend = ctx.isFriday ? " Have a nice and sunny weekend" : ""
      parts.push(`Good Night, folks!${weekend}\nSee ya`)
    }

    messages.push(parts.filter(Boolean).join("\n\n"))
  }

  return messages
}

/** Holiday post with optional custom copy, optional image URL, and standard signature. */
export function buildHolidayMessage(holidayName: string, customMessage: string | undefined, now: Date, ctx: PostContext, imageUrl?: string): string {
  const parts: string[] = []
  if (ctx.isMorning) parts.push("Good Morning, everyone!")
  parts.push(customMessage ?? `Today is ${holidayName}`)
  if (imageUrl) parts.push(imageUrl)
  parts.push(buildSignature(now))
  return parts.filter(Boolean).join("\n\n")
}

/** Time-of-day flags for greetings (mirrors domain/context). */
export type PostContext = {
  isMorning: boolean
  isEvening: boolean
  isFriday: boolean
}
