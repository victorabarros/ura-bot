import express from "express"
import routes from "./routes"
import config from "./config"
import { middleware } from "./midleware"

const { port, version } = config

express()
  .use(middleware)
  .use(routes)
  .listen(port, () => console.log(`runnnig UraBot ${version} on port ${port}`))
