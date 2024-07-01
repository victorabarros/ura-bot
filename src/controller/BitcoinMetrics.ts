import { Request, Response } from "express"
import httpStatus from "http-status"
import { exchangeService } from "../services"
import { signature } from "./helper"

export const postBTCIndexes = async (req: Request, res: Response) => {
  const now = new Date()

  const currencies = await exchangeService.getCurrenciesValues()

  const lines = [
    "Bitcoin Indexes\n",
    `$${currencies.btc.symbol} ${(currencies.btc.value).toFixed(2)}`,
    signature(now, "#Bitcoin"),
  ]

  const messages: string[] = [lines.join("\n")]

  return await postMessage(messages, now, res)
}

const postMessage = async (messages: string[], now: Date, res: Response): Promise<any> => {

  try {
    messages.forEach(async message => {
        console.log({message}) // TODO remove
        // TODO
        //   await btcMetrxTwitter.postMessage(message)
        //   await btcMetrxNostr.postMessage(message)
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
