import { Router } from "express"
import { postBrlPrice, heartbeat } from "./controller"
import { postBTCIndexes } from "./controller/BitcoinMetrics"

const routes = Router()

// health
routes.get("/heartbeat", heartbeat)

// brazilian real bot
routes.post("/brlbot/prices", postBrlPrice)

// bitcoin metrics
routes.post("/btcmetrx/indexes", postBTCIndexes)

export default routes
