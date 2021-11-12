const throwMissingVariable = (name: string) => { throw new Error(`missing required env variable "${name}"`) }

export default {
  port: process.env.PORT || throwMissingVariable("PORT"),
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || throwMissingVariable("TWITTER_API_KEY"),
    apiKeySecret: process.env.TWITTER_API_KEY_SECRET || throwMissingVariable("TWITTER_API_KEY_SECRET"),
    accessToken: process.env.TWITTER_ACCESS_TOKEN || throwMissingVariable("TWITTER_ACCESS_TOKEN"),
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || throwMissingVariable("TWITTER_ACCESS_TOKEN_SECRET"),
  },
  finnhub: {
    address: process.env.FINNHUB_ADDRESS || throwMissingVariable("FINNHUB_ADDRESS"),
    apiKey: process.env.FINNHUB_API_KEY || throwMissingVariable("FINNHUB_API_KEY"),
  },
}
