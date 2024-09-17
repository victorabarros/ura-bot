import { Request, Response } from "express"
import httpStatus from "http-status"
import { brlTwitter, exchangeService } from "../services"
import { AVAILABLE_CURRENCIES } from "../services/Currency"


export const postBrlPrice = async (req: Request, res: Response) => {
  const now = new Date()

  const currencies = await exchangeService.getCurrenciesValues()

  const bodyLines = AVAILABLE_CURRENCIES
  .filter(c => c !== "brl")
  .map((c: string) => {
    const currency = (currencies as any)[c]
      const price = currency.value * currencies.brl.value
      const formattedPrice = price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${currency.flag} $${currency.symbol} ${formattedPrice}`
    })

  const lines = bodyLines
    .concat(["\n", "#BRLbot"])

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
