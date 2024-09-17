import { Request, Response } from "express"
import httpStatus from "http-status"
import { brlTwitter, exchangeService } from "../services"
import { isHoliday, holidayMessage } from "../services/Holidays"
import { signature } from "./helper"

export const postBrlPrice = async (req: Request, res: Response) => {
  const now = new Date()

  if (isHoliday(now)) {
    const lines = [
      holidayMessage(now),
      signature(now, "#BRLbot"),
    ].join("\n\n")

    return await postMessage(lines, now, res)
  }

  const currencies = await exchangeService.getCurrenciesValues()

  const headLine = "Cambio do BRL Real:\n"
  const bodyLines = ["usd", "eur", "cad", "gbp", "chf", "jpy", "btc"]
    .map((c: string) => {
      const currency = (currencies as any)[c]
      // TODO pretify number, like 313759.29 to 313,759.29
      return `${currency.flag} $${currency.symbol} ${(currency.value * currencies.brl.value).toFixed(2)}`
    })

  const lines = [headLine]
    .concat(bodyLines)
    .concat(["\n", signature(now, "#BRLbot")])

  return await postMessage(lines.join("\n"), now, res)
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
