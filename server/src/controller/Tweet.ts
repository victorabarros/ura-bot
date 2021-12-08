import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService from "../services/Finnhub"
import TwitterService from "../services/Twitter"

export const STOCKS = [
  "URA",  // ETF: 23%-Cameco 20%-Kazatomprom 50%-(out of uranium market)
  "CCJ",  // Cameco: second largest producer
  "URNM", // ETF
  "UEC",  // Uranium Energy Corp
  "NXE",  // Next Gen Energy
  // "HURA", // ETF
  "UUUU", // Energy Fuels
  "DNN",
  // "PDN",
  // "SRUUF",
  // "LIT",  // Lithium(battery)
]

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

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    const quotes = await Promise.all(STOCKS.map(FinnHubService.getQuoteRealTime))
    const quotesHandled = quotes.map(({ symbol, price }) =>
      `${symbol} ${" ".repeat(4 - symbol.length)}- $USD ${" ".repeat(5 - price.toString().length)}${price}`
    )

    const message = [
      "Stock prices",
      quotesHandled.join("\n"),
      `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium`,
    ].join("\n\n")

    const { id } = await TwitterService.writeTweet(message)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
