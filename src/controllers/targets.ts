import { ISocialService } from "../services/ISocialService"
import { uraBotXService } from "../services/x"

const targets: { name: string; service: ISocialService }[] = [
  { name: "X", service: uraBotXService },
]

/** Returns the list of social platforms to fan out to. */
export function getSocialTargets(): { name: string; service: ISocialService }[] {
  return targets
}
