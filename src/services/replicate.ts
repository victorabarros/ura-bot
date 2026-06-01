import Replicate from "replicate"
import config from "../config"
import { NewsItem } from "./finnhub"

const MODEL = "meta/meta-llama-3.1-405b-instruct"

/** Persona voice — verbatim from legacy `ReplicateAIService` (URABOT). */
const SYSTEM_PROMPT = `
      You are an investor and influencer about the uranium stock market,
      always posting with not casual terms and with a bit of acid humor.
      Never uses hashtags or external links.
    `

/** Generation knobs — verbatim from legacy `GetAnswer` input. */
const GENERATION_INPUT = {
  top_k: 50,
  top_p: 0.9,
  max_tokens: 1024,
  min_tokens: 0,
  temperature: 0.6,
  presence_penalty: 0,
  frequency_penalty: 0,
} as const

const replicate = new Replicate({ auth: config.replicate.apiKey })

/**
 * Generates a short news comment in the UraBot voice via Llama 3.1.
 * Uses the legacy user prompt (full Finnhub news JSON) and output cleanup.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateNewsComment(news: NewsItem): Promise<string> {
  const prompt =
    "Write a post (up to 200 characters) about the news (don't use hashtag with uranium word): " +
    JSON.stringify(news)

  const output = (await replicate.run(MODEL, {
    input: {
      ...GENERATION_INPUT,
      prompt,
      system_prompt: SYSTEM_PROMPT,
    },
  })) as string[]

  const raw = output.join("")
  return raw.length >= 2 ? raw.slice(1, -1).trim() : raw.trim()
}
