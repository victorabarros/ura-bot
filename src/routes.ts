import { Router } from "express"
import { heartbeat } from "./controllers/heartbeat"
import { healthcheck } from "./controllers/healthcheck"
import { postUraStock } from "./controllers/stocks"
import { postUraNews } from "./controllers/news"
import { getLatestUraPost } from "./controllers/latestPost"

const router = Router()

// Health — no auth
router.get("/heartbeat", heartbeat)
router.get("/healthcheck", healthcheck)

// Public read — no auth
router.get("/urabot/latest-post", getLatestUraPost)

// Uranium bot actions — require API key (enforced by authMiddleware)
router.post("/urabot/stocks", postUraStock)
router.post("/urabot/news", postUraNews)

export default router
