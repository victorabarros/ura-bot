import { Request, Response } from 'express'
import httpStatus from "http-status"
import FinnHubService from '../services/Finnhub'
import TwitterService from '../services/Twitter'

export default {
  async postStock(req: Request, res: Response) {
    const now = new Date()

    // TODO add trycatch
    const { symbol, price } = await FinnHubService.getQuoteRealTime()

    const message = [
      symbol,
      `USD ${price}`,
      now.toString(),
      // TODO idea: https://twitter.com/DolarBipolar/status/1458801696017113093
      // TODO add font/vendor
    ].join("\n")

    // TODO add trycatch
    const { id } = await TwitterService.writeTweet(message)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
