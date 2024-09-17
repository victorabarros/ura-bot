export * from "./BrazilianReal"
export * from "./Uranium"

import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

export const heartbeat = async (req: Request, res: Response) => {
  return res
    .status(httpStatus.OK)
    .json({ success: true, version: config.version })
}
