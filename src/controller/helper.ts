import { GetQuoteResponse } from "../services/Finnhub"

const DATE_FORMAT = {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as Intl.DateTimeFormatOptions

export const signature = (now: Date, sign: string): string => (
  `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n${sign}`
)

export const mapQuotesToBodyMessage = (quotes: Array<GetQuoteResponse>): string[] =>
  quotes.map(({ symbol, price, openPrice }) => {
    const message = `$${symbol}${" ".repeat(6 - symbol.length)}${price}`

    const delta = (100 * (price - openPrice)) / openPrice
    const deltaString = delta.toFixed(2)
    const deltaMessage = `${delta < 0 ? " " : "+"}${deltaString}% ${delta < 0 ? "📉" : "📈"}`
    return `${message} ${deltaMessage}`
  })
