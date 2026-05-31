import { ISocialService } from "../services/ISocialService"
import { XService } from "../services/x"
import { NostrService } from "../services/nostr"

let targets: { name: string; service: ISocialService }[] | null = null

export function getSocialTargets(): { name: string; service: ISocialService }[] {
  if (!targets) {
    targets = [
      { name: "X", service: new XService() },
      { name: "Nostr", service: new NostrService() },
    ]
  }
  return targets
}
