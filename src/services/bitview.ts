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
}

type BulkSeriesEntry = {
  data: number[]
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
      series: "mvrv,realized_price",
      start: -1,
    },
  })

  const [mvrvEntry, realizedEntry] = data

  const mvrv = mvrvEntry?.data[0]
  const realizedPriceUsd = realizedEntry?.data[0]

  if (mvrv === undefined || realizedPriceUsd === undefined) {
    throw new Error("Bitview bulk response missing expected series")
  }

  return { mvrv, realizedPriceUsd }
}
