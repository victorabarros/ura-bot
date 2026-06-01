function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

/** Non-secret defaults — change in code, not via env. */
const SERVER_PORT = 8082
const SERVER_VERSION = "2.0.0"
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1/"
const REPLICATE_MODEL = "meta/meta-llama-3-70b-instruct"

const config = {
  port: SERVER_PORT,
  apiKey: env("API_KEY"),
  version: SERVER_VERSION,

  finnhub: {
    apiKey: env("FINNHUB_API_KEY"),
    baseUrl: FINNHUB_BASE_URL,
  },

  x: {
    consumerKey: env("URA_BOT_X_CONSUMER_KEY"),
    consumerSecret: env("URA_BOT_X_CONSUMER_KEY_SECRET"),
    accessToken: env("URA_BOT_X_ACCESS_TOKEN"),
    accessTokenSecret: env("URA_BOT_X_ACCESS_TOKEN_SECRET"),
  },

  replicate: {
    apiKey: env("REPLICATE_API_TOKEN"),
    model: REPLICATE_MODEL,
  },

} as const

/**
 * Configuration: secrets from env (fail-fast), defaults in code.
 * See `docs/CONFIGURATION.md` and `.cursor/rules/environment-secrets-only.mdc`.
 */
export default config
