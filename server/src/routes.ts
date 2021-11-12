import { Request, Response, Router } from 'express'
import httpStatus from "http-status"
import Tweet from "./controller/Tweet"
import TwitterService from "./services/Twitter"
import config from "./config"

const { version } = config

const routes = Router()

routes.post("/tweet", Tweet.postStock)
routes.get("/health", async (req: Request, res: Response) => {
  // TODO ping vendor

  await TwitterService.check()
  // TODO improve response

  return res
    .status(httpStatus.OK)
    .json({ health: "check", version })
})

export default routes
