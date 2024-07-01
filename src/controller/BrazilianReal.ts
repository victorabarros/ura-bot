import { Request, Response } from "express"
import httpStatus from "http-status"
import { brlTwitter, exchangeService } from "../services"
import { isHoliday, holidayMessage } from "../services/Holidays"

const DATE_FORMAT = {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as Intl.DateTimeFormatOptions

export const postBrlPrice = async (req: Request, res: Response) => {
  const now = new Date()
  if (isHoliday(now)) {
    const message = [
      holidayMessage(now),
      signature(now),
    ].join("\n\n")

    return await postMessage(message, now, res)
  }

  const currencies = await exchangeService.getBrlValues()

  const lines = ["Cambio do BRL Real:\n",]
    .concat(
      ["usd", "eur", "cad", "gbp", "chf", "jpy"].map((c: string) => {
        const currency = (currencies as any)[c]
        return `${currency.flag} $${currency.symbol} ${(currency.value * currencies.brl.value).toFixed(2)}`
      })
    ).concat(["\n", signature(now),])

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

const signature = (now: Date): string => (
  `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#BRLbot`
)
