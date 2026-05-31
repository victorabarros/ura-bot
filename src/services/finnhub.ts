import axios from "axios"
import config from "../config"

const http = axios.create({
  baseURL: config.finnhub.baseUrl,
  params: { token: config.finnhub.apiKey },
  timeout: 10_000,
})

export type Quote = {
  symbol: string
  price: number
  openPrice: number
  highPrice: number
  lowPrice: number
  previousClosePrice: number
}

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

export async function searchNews(symbol: string, fromDate: string, toDate: string): Promise<NewsItem[]> {
  const { data } = await http.get<NewsItem[]>("/company-news", {
    params: { symbol, from: fromDate, to: toDate },
  })
  return data ?? []
}

export async function getMarketHolidays(exchange: string = "US"): Promise<FinnhubMarketHolidayResponse> {
  const { data } = await http.get<FinnhubMarketHolidayResponse>("/stock/market-holiday", {
    params: { exchange },
  })
  return data
}
