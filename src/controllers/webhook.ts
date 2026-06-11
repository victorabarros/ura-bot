import crypto from "crypto"
import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

/**
 * Responds to X's Challenge-Response Check (CRC) on webhook registration and
 * periodic re-validation. Returns HMAC-SHA256 of the crc_token signed with the
 * UraBot X consumer secret.
 *
 * @see https://docs.x.com/x-api/webhooks/webhook-crc-check
 * @see docs/3rd-parties/twitter-x-dot-com.md
 */
export const handleWebhookCrc = (req: Request, res: Response): void => {
  const { crc_token } = req.query
  if (typeof crc_token !== "string") {
    console.warn("[webhook] CRC request missing crc_token")
    res.status(httpStatus.BAD_REQUEST).json({ error: "Missing crc_token" })
    return
  }
  const hash = crypto
    .createHmac("sha256", config.x.urabot.consumerSecret)
    .update(crc_token)
    .digest("base64")
  console.log("[webhook] CRC challenge responded successfully")
  res.status(httpStatus.OK).json({ response_token: `sha256=${hash}` })
}

/** Acknowledges inbound X webhook event deliveries with 200. No processing rules yet. */
export const receiveWebhook = (req: Request, res: Response): void => {
  console.log("[webhook] Event received:", JSON.stringify(req.body ?? {}))
  res.status(httpStatus.OK).send()
}
