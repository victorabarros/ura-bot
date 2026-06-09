import Replicate from "replicate"
import config from "../config"
import { NewsItem } from "./finnhub"
import { TweetResult } from "./x"

const MODEL = "meta/meta-llama-3-70b-instruct"
const IMAGE_MODEL = "google/nano-banana-2"

/** Persona voice for all LLM-generated posts. */
const SYSTEM_PROMPT = `
      You are a uranium market investor and influencer with a sharp, unapologetic voice.
      You post with precision — no casual language, always a hint of dry, acid humor.
      You are a principled libertarian: you revere individual freedom, free markets, and
      sound money. You have zero patience for bureaucracy, regulatory overreach, and the
      expansionist ambitions of large governments. You believe nuclear energy and uranium
      are cornerstones of a free, prosperous civilization — and you say so without hedging.
      Never use hashtags or external links.
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
 * Generates a short holiday greeting in the UraBot voice.
 * Used when no custom message is defined for a holiday.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateHolidayComment(holidayName: string, now: Date = new Date()): Promise<string> {
  const year = now.getFullYear()
  const prompt =
    `Write a short post (up to 200 characters) wishing happy ${holidayName} ${year} to uranium investors (don't use hashtag with uranium word)`

  const output = await replicate.run(MODEL as `${string}/${string}`, { input: buildInput(prompt) })
  return parseModelOutput(output)
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
 * Generates a short comment about trending X posts in the UraBot voice.
 * The top tweets (by engagement) are passed as context.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateTrendingComment(tweets: TweetResult[]): Promise<string> {
  const prompt =
    "Write a post (up to 200 characters) reacting to what uranium investors are talking about on X right now (don't use hashtag with uranium word): " +
    JSON.stringify(tweets.map(({ text, likeCount, retweetCount }) => ({ text, likeCount, retweetCount })))

  const output = await replicate.run(MODEL as `${string}/${string}`, { input: buildInput(prompt) })
  return parseModelOutput(output)
}

/**
 * Generates a holiday-themed image using the Nano Banana 2 image model.
 * Returns the URL of the generated image.
 *
 * @see https://replicate.com/google/nano-banana-2
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateHolidayImage(holidayName: string, now: Date = new Date()): Promise<string> {
  const year = now.getFullYear()
  const prompt = `Festive ${holidayName} ${year} celebration, nuclear energy and uranium market theme, dynamic digital art, vivid colors, high quality`
  const output = await replicate.run(IMAGE_MODEL as `${string}/${string}`, {
    input: { prompt, aspect_ratio: "1:1", output_format: "jpg" },
  })
  const url = Array.isArray(output) ? String(output[0]) : String(output)
  if (!url) throw new Error(`No image returned for holiday: ${holidayName}`)
  return url
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
