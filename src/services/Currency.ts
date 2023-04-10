import axios from "axios"
import config from "../config"

const { address } = config.currency

export interface Currency {
  value: number
  symbol: string
  name: string
}

interface GetCurrenciesResponse {
  brl: Currency // Brazil Real
  usd: Currency // US Dollar
  eur: Currency // European Euro
  jpy: Currency // Japanese Yen
  gbp: Currency // British Pound
  chf: Currency // Swiss Franc
  cad: Currency // Canadian Dollar
}

interface ICurrencyService {
  getBrlValues(): Promise<GetCurrenciesResponse>
}

class CurrencyService implements ICurrencyService {
  async getBrlValues(): Promise<GetCurrenciesResponse> {
    const { data } = await axios.get(address)
    const { s: { r: rates } } = data

    return {
      brl: { value: parseFloat(rates.BRL), symbol: "BRL", name: "Real Brasileiro" },
      usd: { value: parseFloat(rates.USD), symbol: "USD", name: "Dolar Americano" },
      eur: { value: parseFloat(rates.EUR), symbol: "EUR", name: "Euro" },
      jpy: { value: parseFloat(rates.JPY), symbol: "JPY", name: "Yen Japones" },
      gbp: { value: parseFloat(rates.GBP), symbol: "GBP", name: "Pound Britanico" },
      chf: { value: parseFloat(rates.CHF), symbol: "CHF", name: "Franco Suiço" },
      cad: { value: parseFloat(rates.CAD), symbol: "CAD", name: "Dolar Canadense" },
    }
  }

}

const service = new CurrencyService()

export default service
