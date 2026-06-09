import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

const UNAUTHENTICATED_PATHS = new Set(["/heartbeat", "/healthcheck", "/urabot/latest-post"])

/**
 * Requires API key on all paths except `/heartbeat` and `/healthcheck`.
 * Logs method and path for each request.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const { method, path } = req
  console.log(`${new Date().toISOString()} ${method} ${path}`)

  if (UNAUTHENTICATED_PATHS.has(path)) {
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
