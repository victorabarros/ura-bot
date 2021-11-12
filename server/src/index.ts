import express, { NextFunction, Request, Response } from "express"
import routes from "./routes"
import config from "../config"

const app = express()
const { port } = config

const middleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req
  console.log(`${new Date().toISOString()} ${method} "${url}" started`)

  next()

  console.log(`${new Date().toISOString()} ${method} "${url}" finished`)
}

app.use(middleware)
app.use(routes)

app.listen(port, () => console.log(`runnnig on port ${port}`))
