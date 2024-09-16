import config from "../config"
import { CurrencyService } from "./Currency"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"

const { uraBot, brlBot } = config.twitter

// data suppliers
export const finnHub = new FinnHubService()
// TODO exchangeService and CurrencyService are terrible names. Fix in some future PR
export const exchangeService = new CurrencyService()

// uranium stocks socials
export const uraTwitter = new TwitterService({ ...uraBot })
export const uraNostr = new NostrService(config.nostr)

// brazilian real socials
export const brlTwitter = new TwitterService(brlBot)
