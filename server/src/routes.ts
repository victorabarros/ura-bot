import { Router } from 'express'

const routes = Router()

routes.get('/health', (req, res) => {
  // TODO ping dependencies
  console.log("GET /health trigged")
  return res.json({ health: 'check' })
})

export default routes
