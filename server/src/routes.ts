import { Request, Response, Router } from "express"
import httpStatus from "http-status"
import Tweet from "./controller/Tweet"
import FinHubService from "./services/Finnhub"
import TwitterService from "./services/Twitter"
import config from "./config"

const { version } = config

const routes = Router()

routes.post("/tweet", Tweet.postStock)
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

  await FinHubService.getQuoteRealTime()
    .catch((err: unknown) => {
      console.log(err)
      responseStatus = httpStatus.SERVICE_UNAVAILABLE
      services.finhub.success = false
    })

  await TwitterService.check()
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
