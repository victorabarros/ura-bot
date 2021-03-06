import axios from "axios"
import config from "../config"

const { address, apiKey } = config.finnhub

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
  getQuoteRealTime(symbol?: string): Promise<IGetQuoteResponse>
  getQuoteCandles(symbol: string, from: number, to: number): Promise<Array<IGetQuoteCandlesResponse>>
}

class FinnHubService implements IFinnHubService {
  async getQuoteRealTime(symbol = "URA"): Promise<IGetQuoteResponse> {
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

    if (data.s === "no_data") throw new Error("get stock candles from finnhub return empty")

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
  // find for uranium/nuclear stocks https://finnhub.io/docs/api/symbol-search
  // share relevant news https://finnhub.io/docs/api/company-news
  // try URA and URNM https://finnhub.io/docs/api/indices-constituents
}

const service = new FinnHubService()

export default service
