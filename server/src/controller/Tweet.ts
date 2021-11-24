import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService from "../services/Finnhub"
import TwitterService from "../services/Twitter"

const STOCKS = ["URA", "CCJ", "URNM", "DNN", "PDN", "SRUUF"]
const DATE_FORMAT = {
  // weekday: "long",
  // year: "numeric",
  // month: "long",
  // day: "numeric",
  timeZone: "America/New_York",
  // timeZoneName: "long",
  hour: "2-digit",
  minute: "2-digit",
  // second: "2-digit",
  hour12: false
} as Intl.DateTimeFormatOptions

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    const header = "Stocks"

    const quotes = await Promise.all(STOCKS.map(FinnHubService.getQuoteRealTime))

    const body = quotes.map(({ symbol, price }) => `${symbol} - $USD ${price}`).join("\n")

    const footer = `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium`

    const { id } = await TwitterService.writeTweet(`${header}\n\n${body}\n\n${footer}`)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
