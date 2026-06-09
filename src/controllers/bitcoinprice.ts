import { Request, Response } from "express"
import httpStatus from "http-status"
import moment from "moment-timezone"
import { getBitcoinMarketData } from "../services/coingecko"
import { getBitcoinOnchainData } from "../services/bitview"
import { getFearGreedIndex } from "../services/alternative"
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
 * MVRV signal:
 *   < 1    — historically deep value zone      🟢
 *   1–2    — fair value                        🟡
 *   2–3.5  — elevated, watch for distribution  🟠
 *   > 3.5  — historically near cycle tops      🔴
 */
const mvrvEmoji = (mvrv: number): string => {
  if (mvrv < 1) return "🟢"
  if (mvrv < 2) return "🟡"
  if (mvrv < 3.5) return "🟠"
  return "🔴"
}

/**
 * Fear & Greed signal:
 *   0–24   — Extreme Fear  😱
 *   25–44  — Fear          😰
 *   45–55  — Neutral       😐
 *   56–74  — Greed         😏
 *   75–100 — Extreme Greed 🤑
 */
const fearGreedEmoji = (value: number): string => {
  if (value <= 24) return "😱"
  if (value <= 44) return "😰"
  if (value <= 55) return "😐"
  if (value <= 74) return "😏"
  return "🤑"
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
    `${fmtPrice(market.priceUsd)}  ${sign}${market.change24hPct.toFixed(2)}% 24h ${arrow}`,
    `Cap: ${fmtCompact(market.marketCapUsd)} · Vol: ${fmtCompact(market.volume24hUsd)}`,
  ]

  if (onchain) {
    lines.push("")
    lines.push("📐 On-Chain")
    lines.push(`MVRV: ${onchain.mvrv.toFixed(2)} ${mvrvEmoji(onchain.mvrv)}  ·  Realized: ${fmtPrice(onchain.realizedPriceUsd)}`)
    lines.push("")
    lines.push("📊 Technicals")
    lines.push(`MA50:  ${fmtPrice(onchain.sma55dUsd)} ${market.priceUsd >= onchain.sma55dUsd ? "🟢" : "🔴"}`)
    lines.push(`MA200: ${fmtPrice(onchain.sma200dUsd)} ${market.priceUsd >= onchain.sma200dUsd ? "🟢" : "🔴"}`)
  }

  if (fearGreed) {
    lines.push("")
    lines.push("🧠 Sentiment")
    lines.push(`Fear & Greed: ${fearGreed.value}/100 — ${fearGreed.classification} ${fearGreedEmoji(fearGreed.value)}`)
  }

  lines.push(`₿itcoin — ${moment(now).format("MMM D, YYYY")}`)
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
