import { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"
import config from "./config"

const { apiKey } = config

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req
  console.log(`${new Date().toISOString()} ${method} "${url}" started`)

  if (!["/health", "/heartbeat"].includes(url)) {
    const { authorization } = req.headers
    if (authorization !== apiKey) {
      return res.status(httpStatus.UNAUTHORIZED).json({ errorMessage: "Invalid token" })
    }
  }

  next()
}
