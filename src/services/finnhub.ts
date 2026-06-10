import axios from "axios"
import config from "../config"

const http = axios.create({
  baseURL: "https://finnhub.io/api/v1/",
  params: { token: config.finnhub.apiKey },
  timeout: 10_000,
})

/** Normalized real-time quote for one ticker. */
export type Quote = {
  symbol: string
  price: number
  openPrice: number
  highPrice: number
  lowPrice: number
  previousClosePrice: number
}

/** Company news article from Finnhub. */
export type NewsItem = {
  id: number
  headline: string
  summary: string
  url: string
  source: string
  category: string
  related: string
  image: string
  datetime: number
}

type FinnhubQuoteResponse = {
  c: number  // current price
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // previous close
}

type FinnhubHoliday = {
  atDate: string
  tradingHour: string
  eventName: string
}

type FinnhubMarketHolidayResponse = {
  data: FinnhubHoliday[]
  exchange: string
  timezone: string
}

/**
 * Fetches the latest quote for a symbol.
 * Throws when price data is missing or zero.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export const getQuote = async (symbol: string): Promise<Quote> => {
  const { data } = await http.get<FinnhubQuoteResponse>("/quote", {
    params: { symbol },
  })

  if (!data.c || data.c === 0) {
    throw new Error(`No quote data available for ${symbol}`)
  }

  return {
    symbol,
    price: Math.round(data.c * 100) / 100,
    openPrice: Math.round(data.o * 100) / 100,
    highPrice: Math.round(data.h * 100) / 100,
    lowPrice: Math.round(data.l * 100) / 100,
    previousClosePrice: Math.round(data.pc * 100) / 100,
  }
}

/**
 * Lists company news for a symbol between inclusive YYYY-MM-DD dates.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export const searchNews = async (symbol: string, fromDate: string, toDate: string): Promise<NewsItem[]> => {
  const { data } = await http.get<NewsItem[]>("/company-news", {
    params: { symbol, from: fromDate, to: toDate },
  })
  return data ?? []
}

/**
 * Returns exchange holiday calendar entries from Finnhub.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export const getMarketHolidays = async (exchange: string = "US"): Promise<FinnhubMarketHolidayResponse> => {
  const { data } = await http.get<FinnhubMarketHolidayResponse>("/stock/market-holiday", {
    params: { exchange },
  })
  return data
}

const HEALTH_TIMEOUT_MS = 5_000

/**
 * Verifies Finnhub API key and connectivity (market-status probe).
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export const checkFinnhubHealth = async (): Promise<void> => {
  await http.get("/stock/market-status", {
    params: { exchange: "US" },
    timeout: HEALTH_TIMEOUT_MS,
  })
}
