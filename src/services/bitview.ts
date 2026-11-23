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
 * Daily series the price post reads, newest point only.
 * `day1` is the index name; BRK v0.13.0 removed the `day` alias.
 */
const latestDailySeriesParams = {
  index: "day1",
  series: "mvrv,realized_price,price_sma_200d,price_sma_55d",
  start: -1,
}

/**
 * Fetches the latest MVRV, realized price, and daily SMAs from bitview.space.
 * No auth. `index=day1` — the old `day` alias returns HTTP 400 since BRK v0.13.0.
 *
 * @see https://bitview.space/api
 * @see https://bitview.space/changes/
 * @see docs/3rd-parties/bitview.md
 */
export const getBitcoinOnchainData = async (): Promise<BitcoinOnchainData> => {
  const { data } = await http.get<BulkSeriesEntry[]>("/api/series/bulk", {
    params: latestDailySeriesParams,
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

/**
 * Readiness probe for the daily series query used by price posts.
 * `/health` stays up when that query is rejected, so this does not call it.
 *
 * @see https://bitview.space/api
 * @see docs/3rd-parties/bitview.md
 */
export const checkBitviewHealth = async (): Promise<void> => {
  const data = await getBitcoinOnchainData()
  const values = [data.mvrv, data.realizedPriceUsd, data.sma55dUsd, data.sma200dUsd]
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Bitview on-chain probe returned a non-numeric value")
  }
}
