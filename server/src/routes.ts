import { Router } from 'express'

const routes = Router()

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

  console.log(message)
  const { id } = { id: "1234" } // TODO request to twitter

  return res.json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
})

routes.get('/health', (req, res) => {
  // TODO ping dependencies
  console.log("GET /health trigged")
  return res.json({ health: 'check' })
})

export default routes
