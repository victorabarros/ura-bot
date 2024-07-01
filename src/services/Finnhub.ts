import axios from "axios"
import config from "../config"

const { address, apiKey } = config.finnhub

export type SearchQuoteResponse = {
  count: number,
  result: Array<{
    description: string
    displaySymbol: string
    symbol: string
    type: string
  }>
}

export type SearchNewsResponse = {
  category: string
  headline: string
  id: number,
  image: string
  related: string
  source: string
  summary: string
  url: string
  // datetime: 1569550360,
}

export type GetQuoteResponse = {
  symbol: string
  price: number
  highPrice: number
  lowPrice: number
  openPrice: number
  previousClosePrice: number
}

type GetQuoteCandlesResponse = {
  timestamp: number
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
}

interface IFinnHubService {
  searchQuote(symbol: string): Promise<SearchQuoteResponse>
  searchNews(symbol: string, from?: Date, to?: Date): Promise<Array<SearchNewsResponse>>
  getQuoteRealTime(symbol: string): Promise<GetQuoteResponse>
  getQuoteCandles(symbol: string, from: number, to: number): Promise<Array<GetQuoteCandlesResponse>>
}

export class FinnHubService implements IFinnHubService {
  async searchQuote(symbol: string): Promise<SearchQuoteResponse> {
    const params = { q: symbol, token: apiKey }
    const { data } = await axios.get(`${address}search`, { params })
    return data
  }

  async searchNews(symbol: string, from?: Date, to?: Date): Promise<Array<SearchNewsResponse>> {
    if (!to) {
      to = new Date()
    }

    if (!from) {
      from = new Date()
      from.setDate(from.getDate() - 1)
    }

    const params = {
      symbol,
      from: from.toLocaleDateString("en-CA"),
      to: to.toLocaleDateString("en-CA"),
      token: apiKey
    }

    const { data } = await axios.get(`${address}company-news`, { params })
    return data
  }

  async getQuoteRealTime(symbol: string): Promise<GetQuoteResponse> {
    const params = { symbol: symbol, token: apiKey }
    const { data: { c, h, l, o, pc, } } = await axios.get(`${address}quote`, { params })

    return {
      symbol,
      price: parseFloat(c.toFixed(2)),
      highPrice: parseFloat(h.toFixed(2)),
      lowPrice: parseFloat(l.toFixed(2)),
      openPrice: parseFloat(o.toFixed(2)),
      previousClosePrice: parseFloat(pc.toFixed(2)),
    }
  }

  async getQuoteCandles(symbol: string, from: number, to: number): Promise<Array<GetQuoteCandlesResponse>> {
    const params = { symbol: symbol, token: apiKey, resolution: 1, from, to }
    const { data } = await axios.get(`${address}stock/candle`, { params })

    if (data.s === "no_data") throw new Error(`get stock "${symbol}" candles from finnhub return empty`)

    const resp = data.t.map((t: number, idx: number): GetQuoteCandlesResponse => ({
      timestamp: t,
      openPrice: data.o[idx],
      closePrice: data.c[idx],
      highPrice: data.h[idx],
      lowPrice: data.l[idx],
      volume: data.v[idx]
    }))

    return resp
  }

}
