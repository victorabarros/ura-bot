function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function envOpt(name: string, fallback: string): string {
  return process.env[name] || fallback
}

const config = {
  port: envOpt("PORT", "8082"),
  apiKey: env("API_KEY"),
  version: envOpt("VERSION", "2.0.0"),

  finnhub: {
    apiKey: env("FINNHUB_API_KEY"),
    baseUrl: envOpt("FINNHUB_ADDRESS", "https://finnhub.io/api/v1/"),
  },

  x: {
    consumerKey: env("URA_BOT_X_CONSUMER_KEY"),
    consumerSecret: env("URA_BOT_X_CONSUMER_KEY_SECRET"),
    accessToken: env("URA_BOT_X_ACCESS_TOKEN"),
    accessTokenSecret: env("URA_BOT_X_ACCESS_TOKEN_SECRET"),
  },

  replicate: {
    apiKey: env("REPLICATE_API_TOKEN"),
    model: envOpt("REPLICATE_MODEL", "meta/meta-llama-3-70b-instruct"),
  },

} as const

/**
 * Validated environment configuration; loaded at import.
 * Throws immediately when a required variable is missing.
 */
export default config
