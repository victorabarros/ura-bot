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
    clientId: env("URA_BOT_X_CLIENT_ID"),
    clientSecret: env("URA_BOT_X_CLIENT_SECRET"),
    accessToken: env("URA_BOT_X_ACCESS_TOKEN"),
    refreshToken: env("URA_BOT_X_REFRESH_TOKEN"),
  },

  nostr: {
    privateKey: env("URA_BOT_NOSTR_SECRET_KEY"),
    relayUrls: envOpt(
      "NOSTR_RELAY_URLS",
      "wss://nostr.bitcoiner.social,wss://nostr-pub.wellorder.net,wss://nostr.mom,wss://nos.lol,wss://relay.mostr.pub,wss://relay.damus.io"
    ).split(","),
  },

  replicate: {
    apiKey: env("REPLICATE_API_TOKEN"),
  },

  redis: {
    host: env("REDIS_CLOUD_HOST"),
    port: parseInt(env("REDIS_CLOUD_PORT"), 10),
    username: env("REDIS_CLOUD_USERNAME"),
    password: env("REDIS_CLOUD_PASSWORD"),
  },
} as const

export default config
