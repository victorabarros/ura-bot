import config from "../config"
import { CurrencyService } from "./Currency"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"
import { ReplicateAIService } from "./ReplicateAI"

const { brlBot } = config.twitter

// data vendors
export const finnHub = new FinnHubService()
export const exchangeService = new CurrencyService()

// AI services
export const replicateAI = new ReplicateAIService()

// brazilian real socials
export const brlTwitter = new TwitterService(brlBot)
export const nostr = new NostrService(config.nostr)
