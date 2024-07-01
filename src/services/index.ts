import config from "../config"
import { CurrencyService } from "./Currency"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"

const { uraBot, brlBot } = config.twitter

export const uraTwitter = new TwitterService({ ...uraBot })
export const brlTwitter = new TwitterService(brlBot)
export const finnHub = new FinnHubService()
export const exchangeService = new CurrencyService()
export const uraNostr = new NostrService(config.nostr)
