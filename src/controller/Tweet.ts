import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService, { IGetQuoteResponse } from "../services/Finnhub"
import CurrencyService from "../services/Currency"
import TwitterService from "../services/Twitter"

const DATE_FORMAT = {
  // weekday: "long",
  // year: "numeric",
  // month: "long",
  // day: "numeric",
  // timeZoneName: "long",
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  // second: "2-digit",
  hour12: false
} as Intl.DateTimeFormatOptions

const NYSE_STOCKS = [
  "CCJ",  // Cameco: second largest producer
  "DNN",
  "NXE",  // Next Gen Energy
  "UEC",  // Uranium Energy Corp
  "URA",  // ETF: 23%-Cameco 20%-Kazatomprom 50%-(out of uranium market)
  "URNM", // ETF
  "UUUU", // Energy Fuels
  "SRUUF",
]

const OTHER_STOCKS = [
  // "U.U",
  // "SPUT",
  // "U.UN", // Sprott: physical uranium trust
  // "UXC", // Future Contract
  // "HURA", // ETF
  // "URM", TODO https://twitter.com/TheTSXDude/status/1631066976666763266?s=20 https://t2.genius.com/unsafe/600x612/https://images.genius.com/99b18d354a84873bd2134f418b4d58d1.589x600x1.jpg
  // TODO find another api that supports the stocks above

  "UROY",
]

export const STOCKS = NYSE_STOCKS.concat(OTHER_STOCKS)

export default {
  async postUraStock(req: Request, res: Response) {
    let fail = false
    const now = new Date()

    const tasks = STOCKS.map(
      async (stock: string): Promise<IGetQuoteResponse | undefined> => {
        try {
          const q = await FinnHubService.getQuoteRealTime(stock)

          if (q.price === 0)
            throw new Error(`stock ${stock} is not available`)

          return q
        } catch (error) {
          fail = true
          console.error(error)
        }
      }
    )

    const quotes = (await Promise.all(tasks))
      .filter(quote => quote !== undefined) as IGetQuoteResponse[]

    if (quotes.length === 0) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({})
    }

    const message = [
      morningMessage(now),
      handleQuotes(quotes).join("\n"),
      `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium`,
      evenningMessage(now),
    ].join("\n\n")


    try {
      const { id } = await TwitterService.writeTweet(message)
      // Stock.bulkCreate(quotes)

      return res
        .status(fail ? httpStatus.PARTIAL_CONTENT : httpStatus.OK)
        .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
    } catch (error) {
      console.error(error)
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({})
    }
  },

  async postBrlPrice(req: Request, res: Response) {
    const now = new Date()
    const currencies = await CurrencyService.getBrlValues()

    const message = [
      `${(currencies.usd.value * currencies.brl.value).toFixed(2)} ${currencies.usd.name}`,
      `${(currencies.eur.value * currencies.brl.value).toFixed(2)} ${currencies.eur.name}`,
      `${(currencies.cad.value * currencies.brl.value).toFixed(2)} ${currencies.cad.name}`,
      `${(currencies.gbp.value * currencies.brl.value).toFixed(2)} ${currencies.gbp.name}`,
      `${(currencies.chf.value * currencies.brl.value).toFixed(2)} ${currencies.chf.name}`,
      `${(currencies.jpy.value * currencies.brl.value).toFixed(2)} ${currencies.jpy.name}`,
    ].join("\n")

    try {
      // TODO tweet on brlbot account
      // const { id } = await TwitterService.writeTweet(message)
      const id = "MOCK"

      return res
        .status(httpStatus.OK)
        .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
    } catch (error) {
      console.error(error)
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({})
    }

  }
}

export const morningMessage = (now: Date): string => (
  (now.getHours() === 14 && now.getMinutes() === 0) ?
    "Good Morning, everyone!" : ""
)

export const evenningMessage = (now: Date): string => (
  (now.getHours() === 21 && now.getMinutes() === 0) ?
    `Good Night, guys! ${fridayMessage(now)}\nSee ya` : ""
)

export const fridayMessage = (now: Date): string => (
  (now.getDay() === 5) ?
    "Have a nice and sunny weekend" : ""
)

const handleQuotes = (quotes: Array<IGetQuoteResponse>): string[] =>
  quotes.map(({ symbol, price, openPrice }) => {
    const message = `$${symbol}${" ".repeat(6 - symbol.length)}${price}`

    const delta = 100 * (price - openPrice) / openPrice
    const deltaString = delta.toFixed(2)
    const deltaMessage = `${" ".repeat(5 - deltaString.length)}${delta < 0 ? "📉  " : "📈 +"}${deltaString}%`
    return `${message} ${deltaMessage}`
  })
