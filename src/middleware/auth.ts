import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

const UNAUTHENTICATED_PATHS = new Set(["/heartbeat", "/healthcheck", "/urabot/latest-post", "/urabot/webhook"])

/**
 * Requires an API key except on health, public read, the X webhook, and `/.well-known`.
 * Logs method and path. Secret-file probes never reach this middleware.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { method, path } = req
  console.log(`${new Date().toISOString()} ${method} ${path}`)

  const openPath = UNAUTHENTICATED_PATHS.has(path)
    || path === "/.well-known"
    || path.startsWith("/.well-known/")
  if (openPath) {
    next()
    return
  }

  const { authorization } = req.headers
  if (authorization !== config.apiKey) {
    res.status(httpStatus.UNAUTHORIZED).json({ error: "Invalid or missing API key" })
    return
  }

  next()
}
