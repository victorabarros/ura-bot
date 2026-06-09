// Config is validated at import time — missing required vars throw immediately
import config from "./config"

import path from "path"
import express from "express"
import { authMiddleware } from "./middleware/auth"
import router from "./routes"

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, "../public")))
app.use(authMiddleware)
app.use(router)

app.listen(config.port, () => {
  console.log(`[ura-bot] v${config.version} listening on port ${config.port}`)
})

/** Express application wired with auth middleware and routes. */
export default app
