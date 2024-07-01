import { Router } from "express"
import { postUraNews, postUraStock, postBrlPrice, health, heartbeat } from "./controller"
import { postBTCIndexes } from "./controller/BitcoinMetrics"

const routes = Router()

// deprecated
routes.post("/tweet", postUraStock)

// health
routes.get("/heartbeat", heartbeat)
routes.get("/health", health)

// uranium stocks bot
routes.post("/urabot/news", postUraNews)
routes.post("/urabot/stocks", postUraStock)

// brazilian real bot
routes.post("/brlbot/prices", postBrlPrice)

// bitcoin metrics
routes.post("/btcmetrx/indexes", postBTCIndexes)

export default routes
