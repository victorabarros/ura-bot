import { Request, Response } from "express"
import httpStatus from "http-status"
import { brlTwitter, exchangeService } from "../services"
import { isHoliday, holidayMessage } from "../services/Holidays"
import { signature } from "./helper"

export const postBrlPrice = async (req: Request, res: Response) => {
  const now = new Date()
  if (isHoliday(now)) {
    const message = [
      holidayMessage(now),
      signature(now, "#BRLbot"),
    ].join("\n\n")

    return await postMessage(message, now, res)
  }

  const currencies = await exchangeService.getCurrenciesValues()

  const lines = ["Cambio do BRL Real:\n",]
    .concat(
      ["usd", "eur", "cad", "gbp", "chf", "jpy", "btc"].map((c: string) => {
        const currency = (currencies as any)[c]
        return `${currency.flag} $${currency.symbol} ${(currency.value * currencies.brl.value).toFixed(2)}`
      })
    ).concat(["\n", signature(now, "#BRLbot"),])

  const message = lines.join("\n")

  return await postMessage(message, now, res)
}

const postMessage = async (message: string, now: Date, res: Response): Promise<any> => {

  try {
    await brlTwitter.postMessage(message)
    return res
      .status(httpStatus.OK)
      .json({ url: "https://twitter.com/BrlBot", created_at: now })
  } catch (error) {
    console.error(error)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({})
  }
}
