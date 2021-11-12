import { Router } from 'express'
import httpStatus from 'http-status'
import TwitterService from './services/Twitter'

const routes = Router()
const twitter = new TwitterService()

routes.post('/twit', async (req, res) => {
  console.log("POST /twit trigged")
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

  const { id } = await twitter.writeTwit(message)

  return res
    .status(httpStatus.OK)
    .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
})

routes.get('/health', async (req, res) => {
  // TODO ping vendor
  console.log("GET /health trigged")

  await twitter.check()
  // TODO improve response

  return res
    .status(httpStatus.OK)
    .json({ health: 'check' })
})

export default routes
