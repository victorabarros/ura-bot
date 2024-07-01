import { Request, Response } from "express"
import httpStatus from "http-status"
import { exchangeService } from "../services"
import { signature } from "./helper"

export const postBTCIndexes = async (req: Request, res: Response) => {
  const now = new Date()

  const currencies = await exchangeService.getBrlValues()
  const currency = currencies.btc
  const msg = `$${currency.symbol} ${(currency.value).toFixed(2)}`

  const lines =
    ["#Bitcoin Indexes\n"]
    .concat(msg)
    .concat(signature(now, "#Bitcoin"))

  const message = lines.join("\n")

  const messages: string[] = [message]

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
