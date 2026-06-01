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

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Fetches the latest quote for a symbol.
 * Throws when price data is missing or zero.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export async function getQuote(symbol: string): Promise<Quote> {
  const { data } = await http.get<FinnhubQuoteResponse>("/quote", {
    params: { symbol },
  })

  if (!data.c || data.c === 0) {
    throw new Error(`No quote data available for ${symbol}`)
  }

  return {
    symbol,
    price: round2(data.c),
    openPrice: round2(data.o),
    highPrice: round2(data.h),
    lowPrice: round2(data.l),
    previousClosePrice: round2(data.pc),
  }
}

/**
 * Lists company news for a symbol between inclusive YYYY-MM-DD dates.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export async function searchNews(symbol: string, fromDate: string, toDate: string): Promise<NewsItem[]> {
  const { data } = await http.get<NewsItem[]>("/company-news", {
    params: { symbol, from: fromDate, to: toDate },
  })
  return data ?? []
}

/** True when Finnhub rejected the request for rate limiting. */
export function isFinnhubRateLimited(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 429
}

/**
 * Returns exchange holiday calendar entries from Finnhub.
 *
 * @see https://finnhub.io/docs/api
 * @see docs/3rd-parties/finhub.md
 */
export async function getMarketHolidays(exchange: string = "US"): Promise<FinnhubMarketHolidayResponse> {
  const { data } = await http.get<FinnhubMarketHolidayResponse>("/stock/market-holiday", {
    params: { exchange },
  })
  return data
}
