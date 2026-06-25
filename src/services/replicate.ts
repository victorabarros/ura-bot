import Replicate from "replicate"
import config from "../config"

const MODEL = "meta/meta-llama-3-70b-instruct"
const IMAGE_MODEL = "google/nano-banana-2"

/** Base persona voice for all LLM-generated content. */
const BASE_PERSONA = `
      You are a uranium market analyst with a sharp, precise voice and dry wit.
      You write with authority — no hedging, no filler, no clichés. One punchy observation per post.
      You cover uranium and nuclear energy from every angle: supply/demand, geopolitics, capital markets,
      energy policy, technology, and investor psychology. Rotate across these angles; never fixate on
      one political frame.
      Never use hashtags or external links.
      Never give investment recommendations, financial advice, or suggest buying or selling any asset.
      Avoid any content that could constitute defamation, harassment, or legal liability — no personal
      attacks, no disparaging named individuals or companies, and nothing that could be construed as
      market manipulation. Stay provocative in ideas, not in targets.
    `

/** One angle is randomly injected per comment call so posts vary across themes. */
const COMMENT_ANGLES = [
  "Focus on supply/demand fundamentals — pounds, inventories, and contract timelines.",
  "Frame it through geopolitics: which nations control the supply, and what that means for buyers.",
  "Explore the energy-transition angle: what this means for utilities switching from gas or coal.",
  "Look at the capital-markets side: investor sentiment, fund flows, or equity valuations.",
  "Consider utility contracting cycles: how long-term deals shape the spot price outlook.",
  "Examine market psychology: what the market is pricing in, and whether it makes sense.",
  "Think about technology: reactor design, enrichment capacity, or the fuel cycle.",
] as const

const replicate = new Replicate({ auth: config.replicate.apiKey })

/**
 * Generates a short post in the UraBot voice for the given prompt.
 * Injects a randomly chosen thematic angle so consecutive posts vary.
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

  const randAngle = COMMENT_ANGLES[Math.floor(Math.random() * COMMENT_ANGLES.length)]
  const system_prompt = `${BASE_PERSONA.trimEnd()}\n      This post: ${randAngle}`

  const input = MODEL.startsWith("openai/")
    ? {
      system_prompt,
      prompt,
      temperature: gen.temperature,
      top_p: gen.top_p,
      max_completion_tokens: gen.max_tokens,
      presence_penalty: gen.presence_penalty,
      frequency_penalty: gen.frequency_penalty,
    }
    : { ...gen, prompt, system_prompt }

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
    input: { prompt, aspect_ratio: "16:9", output_format: "jpg", temperature: .7, system_prompt: BASE_PERSONA, },
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
