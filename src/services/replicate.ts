import Replicate from "replicate"
import config from "../config"

const MODEL = "meta/meta-llama-3.1-405b-instruct"

const SYSTEM_PROMPT = `You are an investor and influencer about the uranium stock market, \
always posting with not casual terms and with a bit of acid humor. \
Never uses hashtags or external links.`

const replicate = new Replicate({ auth: config.replicate.apiKey })

type NewsContext = {
  headline: string
  summary: string
}

/**
 * Generates a short news comment in the UraBot voice via Llama 3.1.
 * Strips surrounding quotes from the model output.
 *
 * @see https://replicate.com/docs
 * @see docs/3rd-parties/replicate-ai.md
 */
export async function generateNewsComment(news: NewsContext): Promise<string> {
  const userPrompt =
    `Write a post (up to 200 characters) about this news item ` +
    `(do not use the word uranium as a hashtag): ` +
    `Headline: ${news.headline}. Summary: ${news.summary}`

  const output = await replicate.run(MODEL, {
    input: {
      prompt: userPrompt,
      system_prompt: SYSTEM_PROMPT,
      temperature: 0.6,
      top_k: 50,
      top_p: 0.9,
      max_tokens: 512,
      min_tokens: 0,
      presence_penalty: 0,
      frequency_penalty: 0,
    },
  }) as string[]

  const raw = output.join("").trim()
  return raw.replace(/^["']|["']$/g, "").trim()
}
