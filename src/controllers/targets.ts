import { ISocialService } from "../services/ISocialService"
import { uraBotXService } from "../services/x"

/** The list of social platforms to fan out to. */
export const SOCIAL_TARGETS: { name: string; service: ISocialService }[] = [
  { name: "X", service: uraBotXService },
]
