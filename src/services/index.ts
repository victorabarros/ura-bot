import config from "../config"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"
import { ReplicateAIService } from "./ReplicateAI"

// data vendors
export const finnHub = new FinnHubService()

// AI services
export const replicateAI = new ReplicateAIService()

// uranium stocks socials
export const uraTwitter = new TwitterService({ ...config.twitter.uraBot })
export const uraNostr = new NostrService(config.nostr)
