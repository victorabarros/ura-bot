import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService from "../services/Finnhub"
import TwitterService from "../services/Twitter"

const dateFormat = {
  // weekday: "long",
  // year: "numeric",
  // month: "long",
  // day: "numeric",
  timeZone: "America/New_York",
  timeZoneName: "long",
  hour: "2-digit",
  minute: "2-digit",
  // second: "2-digit",
  hour12: false
}

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    const { symbol, price } = await FinnHubService.getQuoteRealTime()

    const header = `${symbol} Stock`
    const body = `$USD ${price}`
    const footer = `${now.toLocaleString("en-US", dateFormat as Intl.DateTimeFormatOptions)}`
    // TODO add delta variation
    // add uranium/nuclear/energy icon
    // 📉

    const { id } = await TwitterService.writeTweet(`${header}\n\n${body}\n\n${footer}\n#Uranium`)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
