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
 * Fetches the latest Crypto Fear & Greed index from alternative.me.
 * No auth required.
 *
 * @see https://alternative.me/crypto/fear-and-greed-index/
 * @see docs/3rd-parties/feargreed.md
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
