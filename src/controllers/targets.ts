import { ISocialService } from "../services/ISocialService"
import { XService } from "../services/x"

let targets: { name: string; service: ISocialService }[] | null = null

/** Returns the singleton list of social platforms to fan out to. */
export function getSocialTargets(): { name: string; service: ISocialService }[] {
  if (!targets) {
    targets = [
      { name: "X", service: new XService() },
    ]
  }
  return targets
}
