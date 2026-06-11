import { Request, Response } from "express"
import httpStatus from "http-status"

/** Receives external webhook payloads. Always acknowledges with 200. */
export const receiveWebhook = (_req: Request, res: Response): void => {
  res.status(httpStatus.OK).send()
}
