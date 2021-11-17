import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService from "../services/Finnhub"
import TwitterService from "../services/Twitter"

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    const { symbol, price } = await FinnHubService.getQuoteRealTime()

    const header = symbol
    const body = `USD ${price}`
    const footer = now.toString()

    const { id } = await TwitterService.writeTweet(`${header}\n${body}\n${footer}`)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
