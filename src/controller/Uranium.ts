import { Request, Response } from "express"
import httpStatus from "http-status"
import {
  GetQuoteResponse,
  SearchNewsResponse,
} from "../services/Finnhub"
import { isHoliday, holidayMessage } from "../services/Holidays"
import { finnHub, uraNostr, uraTwitter, replicateAI } from "../services"
import { handleQuotes, signature } from "./helper"

const NYSE_STOCKS = [
  "CCJ",  // Cameco: second largest producer
  "DNN",
  "NXE",  // Next Gen Energy
  "UEC",  // Uranium Energy Corp
  "URA",  // ETF: 23%-Cameco 20%-Kazatomprom 50%-(out of uranium market)
  "URNM", // ETF
  "UUUU", // Energy Fuels
  "SRUUF",
  "SMR", // NuScale Power Corporation (SMR)
]

const OTHER_STOCKS = [
  // "U.U",
  // "U.UN", // Sprott: physical uranium trust
  // "UXC", // Future Contract
  // "HURA", // ETF
  // "NANO",
  "URNJ",

  "UROY",
]

export const STOCKS = NYSE_STOCKS.concat(OTHER_STOCKS)

export const postUraStock = async (req: Request, res: Response) => {
  const now = new Date()

  // TODO use isFirstPostOfDay(now) to avoid multiple posts
  if (isHoliday(now)) {
    const message = [
      morningMessage(now),
      holidayMessage(now),
      signature(now, "#Uranium ☢️"),
      evenningMessage(now),
    ].join("\n\n")
    return await postMessage([message], now, res)
  }

  const tasks = STOCKS.map(
    async (stock: string): Promise<GetQuoteResponse | undefined> => {
      try {
        const q = await finnHub.getQuoteRealTime(stock)

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

  const stocksPerMessage = 6
  const messages = []
  for (let i = 0; i < quotes.length; i += stocksPerMessage) {
    const message = [
      morningMessage(now),
      handleQuotes(quotes.slice(i, i + stocksPerMessage)).join("\n"),
      signature(now, "#Uranium ☢️"),
      evenningMessage(now),
    ].join("\n\n")
    messages.push(message)
  }

  return await postMessage(messages, now, res)
}

export const postUraNews = async (req: Request, res: Response) => {
  const now = new Date()
  let newsArray: Array<SearchNewsResponse> = []
  let iterLimit = 0

  // iter til find some newsArray
  while (newsArray.length == 0 && iterLimit < STOCKS.length * 4) {
    const randomStock = STOCKS[Math.floor(Math.random() * STOCKS.length)]
    newsArray = await finnHub.searchNews(randomStock)
    iterLimit = iterLimit + 1
  }

  if (newsArray.length == 0) {
    return res
      .status(httpStatus.NO_CONTENT)
      .json({})
  }

  const news = newsArray[Math.floor(Math.random() * newsArray.length)]
  const prompt = "Write a post (up to 200 characters) about the news (don't use hashtag with uranium word): " + JSON.stringify(news)
  const comment = await replicateAI.GetAnswer(prompt)

  const message = [
    comment,
    "",
    "#Uranium☢️",
    // TODO use a shorten url, like bit.ly
    news.url,
  ].join("\n")

  return await postMessage([message], now, res)
}

const postMessage = async (messages: string[], now: Date, res: Response): Promise<any> => {

  try {
    messages.forEach(async message => {
      await uraTwitter.postMessage(message)
      await uraNostr.postMessage(message)
    })

    return res
      .status(httpStatus.OK)
      .json({ created_at: now })
  } catch (error) {
    console.error(error)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({})
  }
}

const morningMessage = (now: Date): string => (
  // TODO us isFirstPostOfDay(now) to avoid multiple posts
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

function isFirstPostOfDay(now: Date) {
  // TODO use redis cache to this
  return true
}
