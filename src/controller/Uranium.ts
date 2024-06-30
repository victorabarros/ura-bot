import { Request, Response } from "express"
import httpStatus from "http-status"
import FinnHubService, {
  GetQuoteResponse,
  SearchNewsResponse,
} from "../services/Finnhub"
import { UraTwitterService } from "../services/Twitter"
import { UraNostrService } from "../services/Nostr"
import { isHoliday, holidayMessage } from "../services/Holidays"

const DATE_FORMAT = {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
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
  "URNJ",

  "UROY",
]

export const STOCKS = NYSE_STOCKS.concat(OTHER_STOCKS)

export const postUraStock = async (req: Request, res: Response) => {
  const now = new Date()
  if (isHoliday(now)) {
    const message = [
      morningMessage(now),
      holidayMessage(now),
      signature(now),
      evenningMessage(now),
    ].join("\n\n")
    return await postMessage(message, now, res)
  }

  const tasks = STOCKS.map(
    async (stock: string): Promise<GetQuoteResponse | undefined> => {
      try {
        const q = await FinnHubService.getQuoteRealTime(stock)

        if (q.price === 0)
          throw new Error(`stock ${stock} is not available`)

        return q
      } catch (error) {
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

  return await postMessage(message, now, res)
}

export const postUraNews = async (req: Request, res: Response) => {
  const now = new Date()
  let news: Array<SearchNewsResponse> = []
  let times = 0

  while (news.length == 0 && times < STOCKS.length * 4) {
    const randomStock = STOCKS[Math.floor(Math.random() * STOCKS.length)]
    news = await FinnHubService.searchNews(randomStock)
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
  ].join("\n")

  await postMessage(message, now, res)

  return res
    .status(httpStatus.OK)
    .json({ url: "https://twitter.com/UraniumStockBot/", created_at: now })
}

const postMessage = async (message: string, now: Date, res: Response): Promise<any> => {
  try {
    const { id } = await UraTwitterService.postMessage(message)
    await UraNostrService.postMessage(message)

    return res
      .status(httpStatus.OK)
      .json({ id, created_at: now })
  } catch (error) {
    console.error(error)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({})
  }
}

const morningMessage = (now: Date): string => (
  (now.getHours() === 14 && now.getMinutes() === 0) ?
    "Good Morning, everyone!" : ""
)

const evenningMessage = (now: Date): string => (
  (now.getHours() === 21 && now.getMinutes() === 0) ?
    `Good Night, guys! ${fridayMessage(now)}\nSee ya` : ""
)

const fridayMessage = (now: Date): string => (
  (now.getDay() === 5) ?
    "Have a nice and sunny weekend" : ""
)

const signature = (now: Date): string => (
  `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Uranium ☢️`
)

const handleQuotes = (quotes: Array<GetQuoteResponse>): string[] =>
  quotes.map(({ symbol, price, openPrice }) => {
    const message = `$${symbol}${" ".repeat(6 - symbol.length)}${price}`

    const delta = (100 * (price - openPrice)) / openPrice
    const deltaString = delta.toFixed(2)
    const deltaMessage = `${" ".repeat(5 - deltaString.length)}${delta < 0 ? " " : "+"}${deltaString}% ${delta < 0 ? "📉" : "📈"}`
    return `${message} ${deltaMessage}`
  })
