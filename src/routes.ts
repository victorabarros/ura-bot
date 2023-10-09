import { Router } from "express"
import { postUraNews, postUraStock, postBrlPrice, health, heartbeat } from "./controller"

const routes = Router()

routes.get("/heartbeat", heartbeat)
routes.get("/health", health)

routes.post("/tweet", postUraStock)

routes.post("/urabot/news", postUraNews)
routes.post("/urabot/stocks", postUraStock)
routes.post("/brlbot/prices", postBrlPrice)

export default routes
