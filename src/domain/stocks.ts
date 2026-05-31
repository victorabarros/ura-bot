import moment from "moment-timezone"
import { Quote } from "../services/finnhub"

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

export const MAX_STOCKS_PER_MESSAGE = 6

const MARKET_TZ = "America/New_York"
const TIME_FORMAT = { timeZone: MARKET_TZ, hour: "2-digit", minute: "2-digit", hour12: false } as const

export function formatQuoteLine(quote: Quote): string {
  const ticker = `$${quote.symbol}`.padEnd(7)
  const delta = quote.openPrice > 0
    ? ((quote.price - quote.openPrice) / quote.openPrice) * 100
    : 0
  const sign = delta >= 0 ? "+" : ""
  const arrow = delta >= 0 ? "📈" : "📉"
  return `${ticker} ${quote.price.toFixed(2)} ${sign}${delta.toFixed(2)}% ${arrow}`
}

export function buildSignature(now: Date): string {
  const time = now.toLocaleString("en-US", TIME_FORMAT)
  return `${time} ${MARKET_TZ}\n#Uranium☢️`
}

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

export function buildHolidayMessage(holidayName: string, customMessage: string | undefined, now: Date, ctx: PostContext): string {
  const parts: string[] = []
  if (ctx.isMorning) parts.push("Good Morning, everyone!")
  parts.push(customMessage ?? `Today is ${holidayName}`)
  parts.push(buildSignature(now))
  return parts.filter(Boolean).join("\n\n")
}

export type PostContext = {
  isMorning: boolean
  isEvening: boolean
  isFriday: boolean
}

export function buildNewsMessage(comment: string, articleUrl: string): string {
  return [comment, "", "#Uranium☢️", articleUrl].join("\n")
}

export function formatDateYMD(d: Date): string {
  return moment(d).tz(MARKET_TZ).format("YYYY-MM-DD")
}
