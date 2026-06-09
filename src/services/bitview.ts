import axios from "axios"

const http = axios.create({
  baseURL: "https://bitview.space",
  timeout: 10_000,
})

/** Bitcoin on-chain metrics from the Bitview/BRK API. */
export type BitcoinOnchainData = {
  /** Market Value to Realized Value ratio. */
  mvrv: number
  /** Average price at which all coins last moved (cost basis). */
  realizedPriceUsd: number
  /** 55-day simple moving average of spot price (nearest Fibonacci window to the classic 50d). */
  sma55dUsd: number
  /** 200-day simple moving average of spot price. */
  sma200dUsd: number
}

type BulkSeriesEntry = {
  data: number[]
}

/**
 * Lightweight liveness probe — hits the `/health` endpoint.
 * Throws on non-200 or network error.
 */
export const checkBitviewHealth = async (): Promise<void> => {
  await http.get("/health")
}

/**
 * Fetches MVRV ratio and realized price from bitview.space.
 * Uses the BRK bulk series endpoint — no auth required.
 *
 * @see https://bitview.space/api
 * @see docs/3rd-parties/bitview.md
 */
export const getBitcoinOnchainData = async (): Promise<BitcoinOnchainData> => {
  const { data } = await http.get<BulkSeriesEntry[]>("/api/series/bulk", {
    params: {
      index: "day",
      series: "mvrv,realized_price,price_sma_200d,price_sma_55d",
      start: -1,
    },
  })

  const [mvrvEntry, realizedEntry, sma200dEntry, sma55dEntry] = data

  const mvrv = mvrvEntry?.data[0]
  const realizedPriceUsd = realizedEntry?.data[0]
  const sma200dUsd = sma200dEntry?.data[0]
  const sma55dUsd = sma55dEntry?.data[0]

  if (mvrv === undefined || realizedPriceUsd === undefined || sma200dUsd === undefined || sma55dUsd === undefined) {
    throw new Error("Bitview bulk response missing expected series")
  }

  return { mvrv, realizedPriceUsd, sma200dUsd, sma55dUsd }
}
