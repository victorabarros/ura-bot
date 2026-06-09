import axios from "axios"

const http = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 10_000,
})

/** Bitcoin market snapshot from CoinGecko's keyless public API. */
export type BitcoinMarketData = {
  priceUsd: number
  change24hPct: number
  marketCapUsd: number
  volume24hUsd: number
}

/**
 * Fetches Bitcoin price, 24h change, market cap, and volume from CoinGecko.
 * Uses the keyless public endpoint — no API key required.
 *
 * @see https://docs.coingecko.com/docs/keyless-public-api
 * @see docs/3rd-parties/coingecko.md
 */
export const getBitcoinMarketData = async (): Promise<BitcoinMarketData> => {
  const { data } = await http.get<{
    bitcoin: {
      usd: number
      usd_24h_change: number
      usd_market_cap: number
      usd_24h_vol: number
    }
  }>("/simple/price", {
    params: {
      ids: "bitcoin",
      vs_currencies: "usd",
      include_market_cap: true,
      include_24hr_vol: true,
      include_24hr_change: true,
    },
  })

  return {
    priceUsd: data.bitcoin.usd,
    change24hPct: data.bitcoin.usd_24h_change,
    marketCapUsd: data.bitcoin.usd_market_cap,
    volume24hUsd: data.bitcoin.usd_24h_vol,
  }
}
