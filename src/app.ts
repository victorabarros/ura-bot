import path from "path"
import express, { ErrorRequestHandler } from "express"
import { authMiddleware } from "./middleware/auth"
import { blockSensitivePaths } from "./middleware/blockSensitivePaths"
import router from "./routes"

const publicDir = path.join(__dirname, "../public")

const hideUnhandledErrors: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "unknown error"
  console.error(`[http] Unhandled error: ${message}`)
  if (res.headersSent) return
  res.status(500).type("text/plain").send("Internal Server Error")
}

const app = express()

app.disable("x-powered-by")
app.use(blockSensitivePaths)
app.use(express.json())
app.use("/.well-known", express.static(path.join(publicDir, ".well-known"), {
  dotfiles: "deny",
  index: false,
}))
app.use(express.static(publicDir, {
  dotfiles: "ignore",
  index: "index.html",
}))
app.use(authMiddleware)
app.use(router)

app.use((_req, res) => {
  res.status(404).type("text/plain").send("Not Found")
})

app.use(hideUnhandledErrors)

/** Express application wired with probe blocking, auth, and routes. */
export default app
