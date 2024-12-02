import { Router } from "express"
import { postUraNews, postUraStock, heartbeat } from "./controller"

const routes = Router()

// health
routes.get("/heartbeat", heartbeat)

// uranium stocks bot
routes.post("/urabot/news", postUraNews)
routes.post("/urabot/stocks", postUraStock)
routes.post("/tweet", postUraStock) // deprecated

export default routes
