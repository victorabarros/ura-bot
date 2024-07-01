export * from "./BrazilianReal"
export * from "./Uranium"
import { finnHub, currency, uraNostr, uraTwitter } from "../services"

import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

export const heartbeat = async (req: Request, res: Response) => {
  return res
    .status(httpStatus.OK)
    .json({ success: true, version: config.version })
}

export const health = async (req: Request, res: Response) => {
  let responseStatus = httpStatus.OK
  const services = {
    finhub: { success: true, },
    fxExchange: { success: true, },
    twitter: { success: true, },
    nostr: { success: true, },
  }

  try {
    await finnHub.getQuoteRealTime("URA")
  } catch (err) {
    console.error("Fail to check FinHub", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.finhub.success = false
  }

  try {
    await currency.getBrlValues()
  } catch (err) {
    console.error("Fail to check FinHub", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.finhub.success = false
  }

  try {
    await uraTwitter.check()
  } catch (err) {
    console.error("Fail to check UraTwitter", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.success = false
  }

  try {
    await uraNostr.check()
  } catch (err) {
    console.error("Fail to check BrlTwitter", JSON.stringify(err))
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.success = false
  }

  return res
    .status(responseStatus)
    .json({ services, version: config.version })
}
