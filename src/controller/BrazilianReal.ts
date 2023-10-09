import { Request, Response } from "express"
import httpStatus from "http-status"
import CurrencyService from "../services/Currency"
import { BrlTwitterService } from "../services/Twitter"

export const postBrlPrice = async (req: Request, res: Response) => {
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

}
