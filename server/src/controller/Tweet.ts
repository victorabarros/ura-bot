import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService from "../services/Finnhub"
import TwitterService from "../services/Twitter"

export const STOCKS = [
  "URA",  // ETF: 23%-CCJ/Cameco 20%-KAP/kazatomprom(largest producer, listen on London. Kazakhistan goverment is major partner. 40% of global market share)
  "CCJ",  // Cameco: second largest producer. from Canada
  "URNM", // ETF
  "UEC",  // Uranium Energy Corp: from Texas. High debt and costs. no revenue
  "NXE",  // Next Gen Energy: development> 1.4Bi evaluation with no revenue. It's a promise
  // "DNN",
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
