import Replicate from "replicate"
import config from "../config"
import { NewsItem } from "./finnhub"

const MODEL = "meta/meta-llama-3-70b-instruct"

/** Persona voice — verbatim from legacy `ReplicateAIService` (URABOT). */
const SYSTEM_PROMPT = `
      You are an investor and influencer about the uranium stock market,
      always posting with not casual terms and with a bit of acid humor.
      Never uses hashtags or external links.
    `

/** Generation knobs — verbatim from legacy `GetAnswer` input (Llama models). */
const LLAMA_GENERATION_INPUT = {
  top_k: 50,
  top_p: 0.9,
  max_tokens: 1024,
  min_tokens: 0,
  temperature: 0.6,
  presence_penalty: 0,
  frequency_penalty: 0,
} as const

const replicate = new Replicate({ auth: config.replicate.apiKey })

function buildInput(prompt: string): Record<string, unknown> {
  if (MODEL.startsWith("openai/")) {
    return {
      system_prompt: SYSTEM_PROMPT,
      prompt,
      temperature: LLAMA_GENERATION_INPUT.temperature,
      top_p: LLAMA_GENERATION_INPUT.top_p,
      max_completion_tokens: LLAMA_GENERATION_INPUT.max_tokens,
      presence_penalty: LLAMA_GENERATION_INPUT.presence_penalty,
      frequency_penalty: LLAMA_GENERATION_INPUT.frequency_penalty,
    }
  }

  return {
    ...LLAMA_GENERATION_INPUT,
    prompt,
    system_prompt: SYSTEM_PROMPT,
  }
}

function parseModelOutput(output: unknown): string {
  const raw = (Array.isArray(output) ? output.join("") : String(output ?? "")).trim()
  if (
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1).trim()
  }
  return raw
}

/**
 * Generates a short news comment in the UraBot voice.
 * Uses the legacy user prompt (full Finnhub news JSON).
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateNewsComment(news: NewsItem): Promise<string> {
  const prompt =
    "Write a post (up to 200 characters) about the news (don't use hashtag with uranium word): " +
    JSON.stringify(news)

  const output = await replicate.run(MODEL as `${string}/${string}`, { input: buildInput(prompt) })
  return parseModelOutput(output)
}

/**
 * Verifies Replicate token and that the configured model is reachable.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function checkReplicateHealth(): Promise<void> {
  const [owner, name] = MODEL.split("/")
  await replicate.models.get(owner, name)
}
