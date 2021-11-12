import { Request, Response } from 'express'
import httpStatus from "http-status"
import TwitterService from '../services/Twitter'

export default {
  async postStock(req: Request, res: Response) {
    // TODO authorization middleware
    const now = new Date()

    const { symbol, price } = { symbol: "URA", price: 30.89 } // TODO fetch from vendor

    const message = [
      symbol,
      `USD ${price.toFixed(2)}`,
      now.toString(),
      // TODO idea: https://twitter.com/DolarBipolar/status/1458801696017113093
      // TODO add font/vendor
    ].join("\n")

    const { id } = await TwitterService.writeTweet(message)

    return res
      .status(httpStatus.OK)
      .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
  }
}
