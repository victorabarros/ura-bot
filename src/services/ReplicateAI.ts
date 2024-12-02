import Replicate from "replicate"
import config from "../config"

const { apiKey } = config.replicate

export enum ReplicateAIPersona {
  URABOT,
}

export class ReplicateAIService {
  replicate: Replicate
  model = {
    language: "meta/meta-llama-3.1-405b-instruct" as  `${string}/${string}`,
  }

  constructor() {
    this.replicate = new Replicate({ auth: apiKey })
  }

  async GetAnswer(prompt: string, persona: ReplicateAIPersona): Promise<string> {
    let system_prompt = ""

    if (persona === ReplicateAIPersona.URABOT) {
      system_prompt = "You are an investor and influencer about the uranium stock market, always posting with not casual terms and with a bit of acid humor. Never uses hashtags of external links."
    } else {
      throw new Error("System not implemented.")
    }

    const input = {
      top_k: 50,
      top_p: 0.9,
      prompt: prompt,
      max_tokens: 1024,
      min_tokens: 0,
      temperature: 0.6,
      system_prompt: system_prompt,
      presence_penalty: 0,
      frequency_penalty: 0,
    }

    const output = await this.replicate.run(this.model.language, { input }) as Array<string>

    return output.join("").slice(1, -1)
  }

}
