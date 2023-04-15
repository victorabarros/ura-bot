import { Request, Response, Router } from "express"
import httpStatus from "http-status"
import FinHubService from "./services/Finnhub"
import config from "./config"
import { UraTwitterService } from "./services/Twitter"
import { postUraNews, postUraStock } from "./controller/Uranium"
import { postBrlPrice } from "./controller/BrazilianReal"

const { version } = config

const routes = Router()

routes.post("/tweet", postUraStock)
routes.post("/news/urabot", postUraNews)
routes.post("/stocks/urabot", postUraStock)
routes.post("/prices/brlbot", postBrlPrice)
routes.get("/health", async (req: Request, res: Response) => {
  let responseStatus = httpStatus.OK
  const services = {
    finhub: {
      success: true,
    },
    twitter: {
      success: true,
    },
  }

  await FinHubService.getQuoteRealTime("URA")
    .catch((err: unknown) => {
      console.log(err)
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.finhub.success = false
    })

  await UraTwitterService.check()
    .catch((err: unknown) => {
      console.log(err)
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.twitter.success = false
    })

  return res
    .status(responseStatus)
    .json({ services, version })
})

export default routes
