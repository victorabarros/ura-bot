import axios from "axios"
import config from "../config"

const { address } = config.currency

interface Currency {
  value: number
  symbol: string
  name: string
}

interface IGetCurrenciesResponse {
  brl: Currency // Brazil Real
  usd: Currency // US Dollar
  eur: Currency // European Euro
  jpy: Currency // Japanese Yen
  gbp: Currency // British Pound
  chf: Currency // Swiss Franc
  cad: Currency // Canadian Dollar
}

class CurrencyService {
  async getCurrencies(): Promise<IGetCurrenciesResponse> {
    const { data: { s: { r: rates } } } = await axios.get(address)

    return {
      brl: { value: rates.BRL, symbol: "BRL", name: "Real Brasileiro" },
      usd: { value: rates.USD, symbol: "USD", name: "Dolar Americano" },
      eur: { value: rates.EUR, symbol: "EUR", name: "Euro" },
      jpy: { value: rates.JPY, symbol: "JPY", name: "Yen Japones" },
      gbp: { value: rates.GBP, symbol: "GBP", name: "Pound Britanico" },
      chf: { value: rates.CHF, symbol: "CHF", name: "Franco Suiço" },
      cad: { value: rates.CAD, symbol: "CAD", name: "Dolar Canadense" },
    }
  }

}

const service = new CurrencyService()

export default service
