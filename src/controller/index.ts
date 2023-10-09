export * from "./BrazilianReal"
export * from "./Uranium"

import { Request, Response } from "express"
import httpStatus from "http-status"
import FinHubService from "../services/Finnhub"
import config from "../config"
import { BrlTwitterService, UraTwitterService } from "../services/Twitter"

export const heartbeat = async (req: Request, res: Response) => {
  return res
    .status(httpStatus.OK)
    .json({ success: true, version: config.version })
}

export const health = async (req: Request, res: Response) => {
  let responseStatus = httpStatus.OK
  const services = {
    finhub: { success: true, },
    twitter: {
      ura: { success: true, },
      brl: { success: true, },
    },
  }

  try {
    await FinHubService.getQuoteRealTime("URA")
  } catch (err) {
    console.error("Fail to check FinHub", JSON.stringify(err))
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.finhub.success = false
  }

  try {
    await UraTwitterService.check()
  } catch (err) {
    console.error("Fail to check UraTwitter", JSON.stringify(err))
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.ura.success = false
  }

  try {
    await BrlTwitterService.check()
  } catch (err) {
    console.error("Fail to check BrlTwitter", JSON.stringify(err))
    responseStatus = httpStatus.SERVICE_UNAVAILABLE
    services.twitter.brl.success = false
  }

  return res
    .status(responseStatus)
    .json({ services, version: config.version })
}
