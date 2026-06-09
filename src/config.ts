const env = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const config = {
  port: process.env.PORT || 8082,
  apiKey: env("API_KEY"),
  version: process.env.VERSION || "2.1.0",

  finnhub: {
    apiKey: env("FINNHUB_API_KEY"),
  },

  x: {
    consumerKey: env("URA_BOT_X_CONSUMER_KEY"),
    consumerSecret: env("URA_BOT_X_CONSUMER_KEY_SECRET"),
    accessToken: env("URA_BOT_X_ACCESS_TOKEN"),
    accessTokenSecret: env("URA_BOT_X_ACCESS_TOKEN_SECRET"),
  },

  replicate: {
    apiKey: env("REPLICATE_API_TOKEN"),
  },

} as const

export default config
