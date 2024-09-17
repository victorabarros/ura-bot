import axios from "axios"
import config from "../config"

const { address } = config.currency

export type Currency = {
  value: number
  symbol: string
  name: string
  flag: string
}

type GetCurrenciesResponse = {
  brl: Currency // Brazil Real
  usd: Currency // US Dollar
  eur: Currency // European Euro
  jpy: Currency // Japanese Yen
  gbp: Currency // British Pound
  chf: Currency // Swiss Franc
  cad: Currency // Canadian Dollar
  btc: Currency // Bitcoin
}

export const AVAILABLE_CURRENCIES: string[] = ["usd", "eur", "cad", "gbp", "chf", "jpy", "btc", "brl"]

interface ICurrencyService {
  getCurrenciesValues(): Promise<GetCurrenciesResponse>
}

export class CurrencyService implements ICurrencyService {
  async getCurrenciesValues(): Promise<GetCurrenciesResponse> {
    const { data } = await axios.get(address)
    const { s: { r: rates } } = data

    return {
      brl: { value: parseFloat(rates.BRL), symbol: "BRL", name: "Real Brasileiro", flag: "🇧🇷" },
      usd: { value: parseFloat(rates.USD), symbol: "USD", name: "Dolar Americano", flag: "🇺🇸" },
      eur: { value: parseFloat(rates.EUR), symbol: "EUR", name: "Euro", flag: "🇪🇺" },
      jpy: { value: parseFloat(rates.JPY), symbol: "JPY", name: "Yen Japones", flag: "🇯🇵" },
      gbp: { value: parseFloat(rates.GBP), symbol: "GBP", name: "Pound Britanico", flag: "🇬🇧" },
      chf: { value: parseFloat(rates.CHF), symbol: "CHF", name: "Franco Suiço", flag: "🇨🇭" },
      cad: { value: parseFloat(rates.CAD), symbol: "CAD", name: "Dolar Canadense", flag: "🇨🇦" },
      btc: { value: 1/parseFloat(rates.BTC), symbol: "BTC", name: "Bitcoin", flag: "₿" },
    }
  }

}
