// Config is validated at import time — missing required vars throw immediately.
import config from "./config"
import app from "./app"

/**
 * Process entrypoint. Listening happens only from this file.
 * Tests import `./app` so they can call the server without binding a port.
 */
app.listen(config.port, () => {
  console.log(`[ura-bot] v${config.version} listening on port ${config.port}`)
})

export default app
