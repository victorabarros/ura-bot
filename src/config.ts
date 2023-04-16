const throwMissingVariable = (name: string) => { throw new Error(`missing required env variable "${name}"`) }

export default {
  port: process.env.PORT || "8080",
  apiKey: process.env.API_KEY || throwMissingVariable("API_KEY"),
  version: process.env.VERSION || "1.3.9",
  twitter: {
    uraBot: {
      apiKey: process.env.URA_BOT_TWITTER_API_KEY || throwMissingVariable("URA_BOT_TWITTER_API_KEY"),
      apiKeySecret: process.env.URA_BOT_TWITTER_API_KEY_SECRET || throwMissingVariable("URA_BOT_TWITTER_API_KEY_SECRET"),
      accessToken: process.env.URA_BOT_TWITTER_ACCESS_TOKEN || throwMissingVariable("URA_BOT_TWITTER_ACCESS_TOKEN"),
      accessTokenSecret: process.env.URA_BOT_TWITTER_ACCESS_TOKEN_SECRET || throwMissingVariable("URA_BOT_TWITTER_ACCESS_TOKEN_SECRET"),
    },
    brlBot: {
      apiKey: process.env.BRL_BOT_TWITTER_API_KEY || throwMissingVariable("BRL_BOT_TWITTER_API_KEY"),
      apiKeySecret: process.env.BRL_BOT_TWITTER_API_KEY_SECRET || throwMissingVariable("BRL_BOT_TWITTER_API_KEY_SECRET"),
      accessToken: process.env.BRL_BOT_TWITTER_ACCESS_TOKEN || throwMissingVariable("BRL_BOT_TWITTER_ACCESS_TOKEN"),
      accessTokenSecret: process.env.BRL_BOT_TWITTER_ACCESS_TOKEN_SECRET || throwMissingVariable("BRL_BOT_TWITTER_ACCESS_TOKEN_SECRET"),
      bearerToken: process.env.BRL_BOT_TWITTER_BEARER_TOKEN || throwMissingVariable("BRL_BOT_TWITTER_BEARER_TOKEN"),
      clientId: process.env.BRL_BOT_TWITTER_CLIENT_ID || throwMissingVariable("BRL_BOT_TWITTER_CLIENT_ID"),
      clientSecret: process.env.BRL_BOT_TWITTER_CLIENT_SECRET || throwMissingVariable("BRL_BOT_TWITTER_CLIENT_SECRET"),
    },
  },
  finnhub: {
    address: process.env.FINNHUB_ADDRESS || throwMissingVariable("FINNHUB_ADDRESS"),
    apiKey: process.env.FINNHUB_API_KEY || throwMissingVariable("FINNHUB_API_KEY"),
  },
  currency: {
    address: process.env.CURRENCY_ADDRESS || throwMissingVariable("CURRENCY_ADDRESS"),
  }
}
