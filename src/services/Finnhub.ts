import axios from "axios"
import config from "../config"

const { address, apiKey } = config.finnhub

export interface ISearchQuoteResponse {
  count: number,
  result: Array<{
    description: string
    displaySymbol: string
    symbol: string
    type: string
  }>
}
export interface IGetQuoteResponse {
  symbol: string
  price: number
  highPrice: number
  lowPrice: number
  openPrice: number
  previousClosePrice: number
}

interface IGetQuoteCandlesResponse {
  timestamp: number
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
}

interface IFinnHubService {
  searchQuote(symbol: string): Promise<ISearchQuoteResponse>
  getQuoteRealTime(symbol: string): Promise<IGetQuoteResponse>
  getQuoteCandles(symbol: string, from: number, to: number): Promise<Array<IGetQuoteCandlesResponse>>
}

class FinnHubService implements IFinnHubService {
  async searchQuote(symbol: string): Promise<ISearchQuoteResponse> {
    const params = { q: symbol, token: apiKey }
    const { data } = await axios.get(`${address}search`, { params })
    return data
  }

  async getQuoteRealTime(symbol: string): Promise<IGetQuoteResponse> {
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

  async getQuoteCandles(symbol: string, from: number, to: number): Promise<Array<IGetQuoteCandlesResponse>> {
    const params = { symbol: symbol, token: apiKey, resolution: 1, from, to }
    const { data } = await axios.get(`${address}stock/candle`, { params })

    if (data.s === "no_data") throw new Error(`get stock "${symbol}" candles from finnhub return empty`)

    const resp = data.t.map((t: number, idx: number): IGetQuoteCandlesResponse => ({
      timestamp: t,
      openPrice: data.o[idx],
      closePrice: data.c[idx],
      highPrice: data.h[idx],
      lowPrice: data.l[idx],
      volume: data.v[idx]
    }))

    return resp
  }

  // TODO:
  // share relevant news https://finnhub.io/docs/api/company-news
}

const service = new FinnHubService()

export default service
