import { Router } from "express"
import { postUraNews, postUraStock, postBrlPrice, heartbeat } from "./controller"
import { postBTCIndexes } from "./controller/BitcoinMetrics"

const routes = Router()

// health
routes.get("/heartbeat", heartbeat)

// uranium stocks bot
routes.post("/urabot/news", postUraNews)
routes.post("/urabot/stocks", postUraStock)
routes.post("/tweet", postUraStock) // deprecated

// brazilian real bot
routes.post("/brlbot/prices", postBrlPrice)

// bitcoin metrics
routes.post("/btcmetrx/indexes", postBTCIndexes)

export default routes
