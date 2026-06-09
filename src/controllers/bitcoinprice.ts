import { Request, Response } from "express"
import httpStatus from "http-status"
import moment from "moment-timezone"
import { getBitcoinMarketData } from "../services/coingecko"
import { getBitcoinOnchainData } from "../services/bitview"
import { getFearGreedIndex } from "../services/feargreed"
import { bitcoinmetrxXService } from "../services/x"
import { logIntegrationError, ApiErrorBody } from "../http/errors"

const fmtPrice = (usd: number): string =>
  `$${Math.round(usd).toLocaleString("en-US")}`

const fmtCompact = (usd: number): string => {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(2)}T`
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`
  return `$${Math.round(usd).toLocaleString("en-US")}`
}

/**
 * POST /bitcoinmetrx/price: fetches Bitcoin market data from CoinGecko,
 * Bitview (on-chain), and Fear & Greed, then posts a roundup via the
 * BitcoinMetrx X account.
 * Each data source degrades gracefully — a failed fetch omits that field.
 */
export const postBitcoinPrice = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date()

  const [marketResult, onchainResult, fearGreedResult] = await Promise.allSettled([
    getBitcoinMarketData(),
    getBitcoinOnchainData(),
    getFearGreedIndex(),
  ])

  if (marketResult.status === "rejected") {
    logIntegrationError("bitcoinprice", "coingecko", marketResult.reason)
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      error: "Bitcoin price data unavailable",
      integration: "coingecko",
    } satisfies ApiErrorBody)
    return
  }

  const market = marketResult.value
  const onchain = onchainResult.status === "fulfilled" ? onchainResult.value : null
  const fearGreed = fearGreedResult.status === "fulfilled" ? fearGreedResult.value : null

  if (onchainResult.status === "rejected") logIntegrationError("bitcoinprice", "bitview", onchainResult.reason)
  if (fearGreedResult.status === "rejected") logIntegrationError("bitcoinprice", "feargreed", fearGreedResult.reason)

  const sign = market.change24hPct >= 0 ? "+" : ""
  const arrow = market.change24hPct >= 0 ? "📈" : "📉"

  const lines: string[] = [
    `₿ Bitcoin — ${moment(now).format("MMM D, YYYY")}`,
    "",
    `${fmtPrice(market.priceUsd)} (${sign}${market.change24hPct.toFixed(2)}% 24h) ${arrow}`,
    `Mkt Cap: ${fmtCompact(market.marketCapUsd)} | Vol: ${fmtCompact(market.volume24hUsd)}/24h`,
  ]

  if (onchain) {
    lines.push("")
    lines.push(`MVRV: ${onchain.mvrv.toFixed(2)}`)
    lines.push(`Realized Price: ${fmtPrice(onchain.realizedPriceUsd)}`)
  }

  if (fearGreed) {
    if (!onchain) lines.push("")
    lines.push(`Fear & Greed: ${fearGreed.value}/100 — ${fearGreed.classification}`)
  }

  lines.push("", "#Bitcoin #BTC")

  const message = lines.join("\n")

  try {
    const { id } = await bitcoinmetrxXService.postMessage(message)
    res.status(httpStatus.OK).json({ created_at: now, tweet_id: id })
  } catch (err) {
    logIntegrationError("bitcoinprice", "x", err)
    res.status(httpStatus.SERVICE_UNAVAILABLE).json({
      error: "Failed to post to X",
      integration: "x",
    } satisfies ApiErrorBody)
  }
}
