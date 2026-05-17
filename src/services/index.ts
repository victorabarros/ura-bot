import config from "../config"
import { FinnHubService } from "./Finnhub"
import { NostrService } from "./Nostr"
import { TwitterService } from "./Twitter"
import { ReplicateAIService } from "./ReplicateAI"
import { XSocialService } from "./XSocial"

// stock data vendors
export const finnHub = new FinnHubService()

// AI services
export const replicateAI = new ReplicateAIService()

// uranium stocks socials
export const uraTwitter = new TwitterService({ ...config.twitter.uraBot })
export const uraNostr = new NostrService(config.nostr)
export const uraXSocial = new XSocialService(config.xSocial.uraBot)
