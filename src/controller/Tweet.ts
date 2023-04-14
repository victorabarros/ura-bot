import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService, { GetQuoteResponse, SearchNewsResponse } from "../services/Finnhub"
import CurrencyService from "../services/Currency"
import { BrlTwitterService, UraTwitterService } from "../services/Twitter"

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
    const now = new Date()
    let fail = false

    const tasks = STOCKS.map(
      async (stock: string): Promise<GetQuoteResponse | undefined> => {
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
      .filter(quote => quote !== undefined) as GetQuoteResponse[]

    if (quotes.length === 0) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({})
    }

    const message = [
      morningMessage(now),
      handleQuotes(quotes).join("\n"),
      signature(now),
      evenningMessage(now),
    ].join("\n\n")


    try {
      const { id } = await UraTwitterService.writeTweet(message)

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

    const lines = ["Cambio do BRL Real:\n",]
      .concat(
        ["usd", "eur", "cad", "gbp", "chf", "jpy"].map((c: string) => {
          const currency = (currencies as any)[c]
          return `${currency.flag} $${currency.symbol} ${(currency.value * currencies.brl.value).toFixed(2)}`
        })
      )

    const message = lines.join("\n")
    console.log(message)

    try {
      // TODO tweet on brlbot account
      // https://github.com/twitterdev/Twitter-API-v2-sample-code/blob/main/Manage-Tweets/create_tweet.js
      // https://www.postman.com/twitter/workspace/twitter-s-public-workspace/request/9956214-5bd6ebb1-9d79-4456-a9a6-22ead4a41625?ctx=code manage-tweets > create a tweet
      const { id } = await BrlTwitterService.writeTweet(message)

      return res
        .status(httpStatus.OK)
        .json({ id, url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
    } catch (error) {
      console.error(error)
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({})
    }

  },

  async postUraNews(req: Request, res: Response) {
    const now = new Date()
    let news: Array<SearchNewsResponse> = []
    let times = 0

    while (news.length == 0 && times < STOCKS.length * 4) {
      const randomStock = STOCKS[Math.floor(Math.random() * STOCKS.length)]
      news = await FinnHubService.searchNews(randomStock)
      //todo improvement: search a batch of news and add to queue to publish for day long
      times = times + 1
    }

    if (news.length == 0) {
      return res
        .status(httpStatus.NO_CONTENT)
        .json({})
    }

    const randomNews = news[Math.floor(Math.random() * news.length)]

    const message = [
      randomNews.headline,
      "",
      signature(now),
      randomNews.url,
      // TODO add disclaimer and image
    ].join("\n")

    const { id } = await UraTwitterService.writeTweet(message)

    return res
      .status(httpStatus.OK)
      .json({ url: `https://twitter.com/UraniumStockBot/status/${id}`, created_at: now })
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

const signature = (now: Date): string => (
  `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium ☢️`
)

const handleQuotes = (quotes: Array<GetQuoteResponse>): string[] =>
  quotes.map(({ symbol, price, openPrice }) => {
    const message = `$${symbol}${" ".repeat(6 - symbol.length)}${price}`

    const delta = 100 * (price - openPrice) / openPrice
    const deltaString = delta.toFixed(2)
    const deltaMessage = `${" ".repeat(5 - deltaString.length)}${delta < 0 ? " " : "+"}${deltaString}% ${delta < 0 ? "📉" : "📈"}`
    return `${message} ${deltaMessage}`
  })
