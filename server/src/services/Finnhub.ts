import axios from "axios"
import config from "../../config"

const { address, apiKey } = config.finnhub

interface IGetQuoteResponse {
  symbol: string
  price: string
  // TODO add more relevant data from https://finnhub.io/docs/api/quote
}

interface IFinnHubService {
  getQuoteRealTime(symbol?: string): Promise<IGetQuoteResponse>
}

class FinnHubService implements IFinnHubService {
  async getQuoteRealTime(symbol = "URA"): Promise<IGetQuoteResponse> {
    const params = { symbol: symbol, token: apiKey }
    const { data } = await axios.get(`${address}quote`, { params })

    return { symbol, price: data.c, }
  }
}

const service = new FinnHubService()

export default service
