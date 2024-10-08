import { Request, Response } from "express"
import httpStatus from "http-status"
import { finnHub } from "../services"
import { mapQuotesToBodyMessage, signature } from "./helper"

export const postBTCIndexes = async (req: Request, res: Response) => {
  const now = new Date()

  const q = await finnHub.getQuoteRealTime("BINANCE:BTCUSDT")
  q.symbol = "BTC"

  const lines = ["Bitcoin MetrX"]
    .concat(mapQuotesToBodyMessage([q]))
    .concat(signature(now, "#Bitcoin"))

  const messages: string[] = [lines.join("\n")]

  return await postMessage(messages, now, res)
}

const postMessage = async (messages: string[], now: Date, res: Response): Promise<any> => {

  try {
    messages.forEach(async message => {
        // TODO remove
        console.log({message})

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
