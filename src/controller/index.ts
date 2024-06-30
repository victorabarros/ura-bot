export * from "./BrazilianReal"
export * from "./Uranium"

import { Request, Response } from "express"
import httpStatus from "http-status"
import FinHubService from "../services/Finnhub"
import CurrencyService from "../services/Currency"
import config from "../config"
import { UraTwitterService } from "../services/Twitter"
import { UraNostrService } from "../services/Nostr"

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
    await FinHubService.getQuoteRealTime("URA")
  } catch (err) {
    console.error("Fail to check FinHub", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.finhub.success = false
  }

  try {
    await CurrencyService.getBrlValues()
  } catch (err) {
    console.error("Fail to check FinHub", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.finhub.success = false
  }

  try {
    await UraTwitterService.check()
  } catch (err) {
    console.error("Fail to check UraTwitter", err)
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.success = false
  }

  try {
    await UraNostrService.check()
  } catch (err) {
    console.error("Fail to check BrlTwitter", JSON.stringify(err))
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.success = false
  }

  return res
    .status(responseStatus)
    .json({ services, version: config.version })
}
