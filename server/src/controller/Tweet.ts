import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService, { IGetQuoteResponse } from "../services/Finnhub"
import TwitterService from "../services/Twitter"
import Stock from "../models/Stock"

const DATE_FORMAT = {
  // weekday: "long",
  // year: "numeric",
  // month: "long",
  // day: "numeric",
  // timeZoneName: "long",
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  // second: "2-digit",
  hour12: false
} as Intl.DateTimeFormatOptions

const NYSE_STOCKS = [
  "CCJ",  // Cameco: second largest producer
  "DNN",
  "NXE",  // Next Gen Energy
  "UEC",  // Uranium Energy Corp
  "URA",  // ETF: 23%-Cameco 20%-Kazatomprom 50%-(out of uranium market)
  "URNM", // ETF
  "UUUU", // Energy Fuels
]

const OTHER_STOCKS = [
  // TODO look where find these prices
  "U.UN", // Sprott: physical uranium trust
  "UXC", // Future Contract
  "HURA", // ETF
  "PDN",
  "SRUUF",
]

export const STOCKS = NYSE_STOCKS

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    const quotes = await Promise.all(STOCKS.map(FinnHubService.getQuoteRealTime))
    const pastStockPrices = await Stock.findAll({ order: [["createdAt", "DESC"]], limit: STOCKS.length })

    const quotesHandled = handleQuotes(quotes, pastStockPrices)

    const message = [
      morningMessage(now),
      quotesHandled.join("\n"),
      `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium`,
      evenningMessage(now),
    ].join("\n\n")

    const { id } = await TwitterService.writeTweet(message)

    Stock.bulkCreate(quotes)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}

export const morningMessage = (now: Date): string => (
  (now.getHours() === 14 && now.getMinutes() === 0) ?
    "Good Morning, everyone!" : ""
)

export const evenningMessage = (now: Date): string => (
  (now.getHours() === 21 && now.getMinutes() === 30) ?
    `Good Night, guys! ${fridayMessage(now)}\nSee ya` : ""
)

export const fridayMessage = (now: Date): string => (
  (now.getDay() === 5) ?
    "Have a nice and sunny weekend" : ""
)

const handleQuotes = (quotes: Array<IGetQuoteResponse>, pastStockPrices: Array<Stock>): string[] =>
  quotes.map(({ symbol, price }) => {
    const message = `${symbol} ${" ".repeat(4 - symbol.length)}` +
      ` $USD ${" ".repeat(5 - price.toString().length)}${price}`

    const idx = pastStockPrices.findIndex(({ symbol: symbolPast }) => symbolPast === symbol)
    if (idx !== -1) {
      const oldPrice = pastStockPrices[idx].price
      const delta = 100 * (price - oldPrice) / oldPrice
      const deltaString = delta.toFixed(2)
      const deltaMessage = `${" ".repeat(8 - deltaString.length)}${delta < 0 ? " " : "+"}${deltaString}%`
      return `${message} ${deltaMessage}`
    }

    return message
  })
