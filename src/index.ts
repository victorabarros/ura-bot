// Config is validated at import time — missing required vars throw immediately
import config from "./config"

import express from "express"
import { authMiddleware } from "./middleware/auth"
import router from "./routes"

const app = express()

app.use(express.json())
app.use(authMiddleware)
app.use(router)

app.listen(config.port, () => {
  console.log(`[ura-bot] v${config.version} listening on port ${config.port}`)
})

export default app
