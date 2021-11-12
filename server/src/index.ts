import express, { NextFunction, Request, Response } from "express"
import httpStatus from "http-status"
import routes from "./routes"
import config from "../config"

const app = express()
const { port, apiKey } = config

const middleware = (req: Request, res: Response, next: NextFunction) => {
  const { method, url } = req
  console.log(`${new Date().toISOString()} ${method} "${url}" started`)

  if (url !== "/health") {
    const { authorization } = req.headers
    if (authorization !== apiKey) {
      return res.status(httpStatus.UNAUTHORIZED).json({ errorMessage: "Invalid token" })
    }
  }

  next()
}

app.use(middleware)
app.use(routes)

app.listen(port, () => console.log(`runnnig on port ${port}`))
