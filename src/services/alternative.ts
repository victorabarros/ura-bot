import axios from "axios"

const http = axios.create({
  baseURL: "https://api.alternative.me",
  timeout: 10_000,
})

/** Crypto Fear & Greed index snapshot. */
export type FearGreedData = {
  /** Numeric value 0–100. */
  value: number
  /** Human-readable label, e.g. "Extreme Fear", "Fear", "Neutral", "Greed", "Extreme Greed". */
  classification: string
}

type FearGreedResponse = {
  data: { value: string; value_classification: string }[]
}

/**
 * Lightweight liveness probe — fetches the latest Fear & Greed value (limit=1).
 * Throws on non-200 or network error.
 */
export const checkAlternativeHealth = async (): Promise<void> => {
  await http.get("/fng/", { params: { limit: 1 } })
}

/**
 * Fetches the latest Crypto Fear & Greed index from alternative.me.
 * No auth required.
 *
 * @see https://alternative.me/crypto/fear-and-greed-index/
 * @see docs/3rd-parties/alternative.md
 */
export const getFearGreedIndex = async (): Promise<FearGreedData> => {
  const { data } = await http.get<FearGreedResponse>("/fng/", {
    params: { limit: 1 },
  })

  const entry = data.data[0]
  if (!entry) throw new Error("Fear & Greed API returned no data")

  return {
    value: parseInt(entry.value, 10),
    classification: entry.value_classification,
  }
}
