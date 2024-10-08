import config from "../config"
import { CurrencyService } from "./Currency"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"
import { ReplicateAIService } from "./ReplicateAI"

const { uraBot, brlBot } = config.twitter

// data suppliers
export const finnHub = new FinnHubService()
export const exchangeService = new CurrencyService()

// AI services
export const replicateAI = new ReplicateAIService()

// uranium stocks socials
export const uraTwitter = new TwitterService({ ...uraBot })
export const uraNostr = new NostrService(config.nostr)

// brazilian real socials
export const brlTwitter = new TwitterService(brlBot)
