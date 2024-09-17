import Replicate from "replicate"
import config from "../config"

const { apiKey } = config.replicate

export class ReplicateAIService {
  replicate: Replicate
  model = {
    language: "meta/meta-llama-3.1-405b-instruct" as  `${string}/${string}`,
  }

  constructor() {
    this.replicate = new Replicate({ auth: apiKey })
  }

  async GetAnswer(prompt: string): Promise<string> {
    const input = {
      top_k: 50,
      top_p: 0.9,
      prompt: prompt,
      max_tokens: 1024,
      min_tokens: 0,
      temperature: 0.6,
      // TODO move this config to variable per resource (ura/btc/brl)
      system_prompt: "You are an investor and influencer about the uranium stock market, always posting with not casual terms and with a bit of acid humor. Never uses hashtags of external links.",
      presence_penalty: 0,
      frequency_penalty: 0,
    }

    const output = await this.replicate.run(this.model.language, { input }) as Array<string>

    return output.join("").slice(1, -1)
  }

  async BuildImage(prompt: string): Promise<string> {
    // TODO copy from here https://github.com/victorabarros/Learning/blob/master/replicate/index.js
    throw new Error("Method not implemented.")
  }

}
