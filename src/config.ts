const throwMissingVariable = (name: string) => { throw new Error(`missing required env variable "${name}"`) }

export default {
  port: process.env.PORT || "8082",
  apiKey: process.env.API_KEY || throwMissingVariable("API_KEY"),
  version: process.env.VERSION || "1.8.0",
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
    },
    baseUrl: "https://api.twitter.com/2/tweets",
  },
  finnhub: {
    address: process.env.FINNHUB_ADDRESS || throwMissingVariable("FINNHUB_ADDRESS"),
    apiKey: process.env.FINNHUB_API_KEY || throwMissingVariable("FINNHUB_API_KEY"),
  },
  currency: {
    address: process.env.CURRENCY_ADDRESS || throwMissingVariable("CURRENCY_ADDRESS"),
  },
  nostr:{
    privateKey: process.env.URA_BOT_NOSTR_SECRET_KEY || throwMissingVariable("URA_BOT_NOSTR_SECRET_KEY"),
    relayUrls: (process.env.NOSTR_RELAY_URLS || "wss://nostr.bitcoiner.social,wss://nostr-pub.wellorder.net,wss://nostr.mom,wss://nos.lol,wss://relay.mostr.pub,wss://relay.damus.io").split(","),
  },
}
