import express from "express"
import routes from "./routes"
import config from "./config"
import { middleware } from "./midleware"

const { port } = config

express()
  .use(middleware)
  .use(routes)
  .listen(port, () => console.log(`runnnig on port ${port}`))
