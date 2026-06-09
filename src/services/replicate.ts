import Replicate from "replicate"
import config from "../config"

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
      Never give investment recommendations, financial advice, or suggest buying or selling any asset.
      Avoid any content that could constitute defamation, harassment, or legal liability — no personal
      attacks, no disparaging named individuals or companies, and nothing that could be construed as
      market manipulation. Stay provocative in ideas, not in targets.
    `

const replicate = new Replicate({ auth: config.replicate.apiKey })

/**
 * Generates a short post in the UraBot voice for the given prompt.
 * Callers are responsible for building domain-specific prompts.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export const generateComment = async (prompt: string): Promise<string> => {
  /** Generation knobs — verbatim from legacy `GetAnswer` input (Llama models). */
  const gen = {
    top_k: 50,
    top_p: 0.9,
    max_tokens: 1024,
    min_tokens: 0,
    temperature: 0.6,
    presence_penalty: 0,
    frequency_penalty: 0,
  } as const

  const input = MODEL.startsWith("openai/")
    ? {
        system_prompt: SYSTEM_PROMPT,
        prompt,
        temperature: gen.temperature,
        top_p: gen.top_p,
        max_completion_tokens: gen.max_tokens,
        presence_penalty: gen.presence_penalty,
        frequency_penalty: gen.frequency_penalty,
      }
    : { ...gen, prompt, system_prompt: SYSTEM_PROMPT }

  const output = await replicate.run(MODEL as `${string}/${string}`, { input })

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
 * Generates an image from the given prompt using the Nano Banana 2 model.
 * Returns the URL of the generated image.
 * Callers are responsible for building domain-specific prompts.
 *
 * @see https://replicate.com/google/nano-banana-2
 * @see docs/3rd-parties/replicate-ai.md
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const output = await replicate.run(IMAGE_MODEL as `${string}/${string}`, {
    input: { prompt, aspect_ratio: "1:1", output_format: "jpg", temperature: 1.0 },
  })
  const url = Array.isArray(output) ? String(output[0]) : String(output)
  if (!url) throw new Error("No image URL returned by image model")
  return url
}


/**
 * Verifies Replicate token and that the configured model is reachable.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export const checkReplicateHealth = async (): Promise<void> => {
  const [owner, name] = MODEL.split("/")
  await replicate.models.get(owner, name)
}
