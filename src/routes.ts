import { Router } from "express"
import { heartbeat } from "./controllers/heartbeat"
import { healthcheck } from "./controllers/healthcheck"
import { postUraStock } from "./controllers/stocks"
import { postUraNews } from "./controllers/news"
import { getLatestUraPost } from "./controllers/latestPost"
import { handleWebhookCrc, receiveWebhook } from "./controllers/webhook"
import { replyToMentions } from "./controllers/replyMentions"
import { postBitcoinPrice } from "./controllers/bitcoinprice"

const router = Router()

const endpoints = [
// Health — no auth
{verb: 'get', path: "/heartbeat", fn: heartbeat} ,
{verb: 'get', path: "/healthcheck", fn: healthcheck} ,

// Public read — no auth
{verb: 'get', path: "/urabot/latest-post", fn: getLatestUraPost} ,

// Uranium bot actions — require API key (enforced by authMiddleware)
{verb: 'post', path: "/urabot/stocks", fn: postUraStock} ,
{verb: 'post', path: "/urabot/news", fn: postUraNews} ,
{verb: 'post', path: "/urabot/reply-mentions", fn: replyToMentions} ,

// Webhook — no auth (called by X for CRC and event delivery)
{verb: 'get', path: "/urabot/webhook", fn: handleWebhookCrc} ,
{verb: 'post', path: "/urabot/webhook", fn: receiveWebhook} ,

// BitcoinMetrx actions — require API key (enforced by authMiddleware)
{verb: 'post', path: "/bitcoinmetrx/price", fn: postBitcoinPrice} ,
]

console.log("List of endpoints: ")

endpoints.forEach(({verb, path, fn}) => {
  console.log(verb,' '.repeat(4-verb.length), path)
  router[verb](path, fn)
})

export default router
