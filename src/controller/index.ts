export * from "./BrazilianReal"
export * from "./Uranium"

import { Request, Response } from "express"
import httpStatus from "http-status"
import FinHubService from "../services/Finnhub"
import config from "../config"
import { BrlTwitterService, UraTwitterService } from "../services/Twitter"

export const callback = async (req: Request, res: Response) => {
  console.log(req.body)
  return res
    .status(httpStatus.OK)
    .json()
}

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

  await FinHubService.getQuoteRealTime("URA")
    .catch((err: unknown) => {
      console.error("Fail to check FinHub", JSON.stringify(err))
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.finhub.success = false
    })

  await UraTwitterService.check()
    .catch((err: unknown) => {
      console.error("Fail to check UraTwitter", JSON.stringify(err))
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.twitter.ura.success = false
    })

  await BrlTwitterService.check()
    .catch((err: unknown) => {
      console.error("Fail to check BrlTwitter", JSON.stringify(err))
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.twitter.brl.success = false
    })

  return res
    .status(responseStatus)
    .json({ services, version: config.version })
}
