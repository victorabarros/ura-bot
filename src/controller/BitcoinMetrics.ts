import { Request, Response } from "express"
import httpStatus from "http-status"

// TODO move to index or helper and reutilize in other controllers
const DATE_FORMAT = {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
} as Intl.DateTimeFormatOptions

export const postBTCIndexes = async (req: Request, res: Response) => {
  const now = new Date()

  const messages: string[] = [signature(now)]

  return await postMessage(messages, now, res)
}

// TODO move to helper or index and reutilize in other controllers
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

// TODO move to a helper or index and reutilize in other controllers
const signature = (now: Date): string => (
  `${now.toLocaleString("en-US", DATE_FORMAT)} ${DATE_FORMAT.timeZone}\n#Bitcoin`
)
