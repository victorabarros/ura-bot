import express from "express"
import routes from "./routes"
import config from "../config"

const app = express()
const { port } = config

app.use((req, res, next) => {
  const { method, url } = req
  console.log(`${new Date().toISOString()} ${method} "${url}" trigged`)
  next()
  console.log(`${new Date().toISOString()} ${method} "${url}" finished`)
})

app.use(routes)

app.listen(port, () => console.log(`runnnig on port ${port}`))
