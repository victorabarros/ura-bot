import axios from "axios"
import config from "../config"

const { address, apiKey } = config.finnhub

interface IGetQuoteResponse {
  symbol: string
  price: number
  // TODO add more relevant data from https://finnhub.io/docs/api/quote
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
    const { data } = await axios.get(`${address}quote`, { params })

    return { symbol, price: parseFloat(data.c.toFixed(2)) }
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
