import { Router } from "express"
import { heartbeat } from "./controllers/heartbeat"
import { healthcheck } from "./controllers/healthcheck"
import { postUraStock } from "./controllers/stocks"
import { postUraNews } from "./controllers/news"
import { getLatestUraPost } from "./controllers/latestPost"
import { receiveWebhook } from "./controllers/webhook"
import { postBitcoinPrice } from "./controllers/bitcoinprice"

const router = Router()

// Health — no auth
router.get("/heartbeat", heartbeat)
router.get("/healthcheck", healthcheck)

// Public read — no auth
router.get("/urabot/latest-post", getLatestUraPost)

// Uranium bot actions — require API key (enforced by authMiddleware)
router.post("/urabot/stocks", postUraStock)
router.post("/urabot/news", postUraNews)

// Webhook — no auth (called by external services)
router.post("/urabot/webhook", receiveWebhook)

// BitcoinMetrx actions — require API key (enforced by authMiddleware)
router.post("/bitcoinmetrx/price", postBitcoinPrice)

export default router
