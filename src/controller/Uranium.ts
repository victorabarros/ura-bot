import { Request, Response } from "express"
import httpStatus from "http-status"
import {
  GetQuoteResponse,
  SearchNewsResponse,
} from "../services/Finnhub"
import { isHoliday, holidayMessage } from "../services/Holidays"
import { finnHub, uraNostr, uraTwitter, replicateAI } from "../services"
import { evenningMessage, isFirstPostOfDay, mapQuotesToBodyMessage, morningMessage, signature } from "./helper"
import { PostMessageResponse } from "../services/ISocialService"
import { ReplicateAIPersona } from "../services/ReplicateAI"

// In order to avoid achieve maximum number of characters in a tweet, we need to limit the number of stocks per message
const MAX_STOCKS_PER_MESSAGE = 6

const NYSE_STOCKS = [
  "CCJ",  // Cameco: second largest producer in the world
  "DNN",
  "NXE",  // Next Gen Energy
  "SMR", // NuScale Power Corporation
  "SRUUF",
  "UEC",  // Uranium Energy Corp
  "URA",  // ETF: 23%-Cameco 20%-Kazatomprom 50%-(out of uranium market)
  "URNM",
  "UUUU", // Energy Fuels
]

const OTHER_STOCKS = [
  "URNJ",
  "UROY",
]

export const STOCKS = NYSE_STOCKS.concat(OTHER_STOCKS)

export const postUraStock = async (req: Request, res: Response) => {
  const now = new Date()

  if (isHoliday(now) && isFirstPostOfDay(now)) {
    const lines = [
      morningMessage(now),
      holidayMessage(now),
      signature(now, "#Uranium☢️"),
    ]

    const message = lines.join("\n\n")
    return await postMessage([message], now, res)
  }

  const getStockTasks = STOCKS.map(
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

  const quotes = (await Promise.all(getStockTasks))
    .filter(quote => quote !== undefined) as GetQuoteResponse[]

  if (quotes.length === 0) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({})
  }

  const messages = []

  for (let i = 0; i < quotes.length; i += MAX_STOCKS_PER_MESSAGE) {
    const partialQuotes = quotes.slice(i, i + MAX_STOCKS_PER_MESSAGE)

    const lines = [
      morningMessage(now),
      mapQuotesToBodyMessage(partialQuotes).join("\n"),
      signature(now, "#Uranium☢️"),
      evenningMessage(now),
    ]

    const message = lines.join("\n\n")
    messages.push(message)
  }

  return await postMessage(messages, now, res)
}

export const postUraNews = async (req: Request, res: Response) => {
  const now = new Date()
  let newsArray: Array<SearchNewsResponse> = []
  let iterLimit = 0

  // iter til find some newsArray randomly
  while (newsArray.length == 0 && iterLimit < STOCKS.length * 4) {
    const stockIndex = Math.floor(Math.random() * STOCKS.length)
    newsArray = await finnHub.searchNews(STOCKS[stockIndex])
    iterLimit = iterLimit + 1
  }

  if (newsArray.length == 0) {
    return res
      .status(httpStatus.NO_CONTENT)
      .json({})
  }

  const newsIndex = Math.floor(Math.random() * newsArray.length)
  const news: SearchNewsResponse = newsArray[newsIndex]
  const prompt = "Write a post (up to 200 characters) about the news (don't use hashtag with uranium word): " +
    JSON.stringify(news)
  const comment = await replicateAI.GetAnswer(prompt, ReplicateAIPersona.URABOT)

  const lines = [
    comment,
    "",
    "#Uranium☢️",
    news.url,
  ]

  const message = lines.join("\n")
  return await postMessage([message], now, res)
}

const postMessage = async (messages: string[], now: Date, res: Response): Promise<any> => {

  try {
    const tasks = Array<Promise<PostMessageResponse>>()

    messages.forEach(async message => {
      tasks.push(uraTwitter.postMessage(message))
      tasks.push(uraNostr.postMessage(message))
    })

    await Promise.all(tasks)

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
