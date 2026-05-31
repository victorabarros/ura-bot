import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

export async function heartbeat(_req: Request, res: Response): Promise<void> {
  res.status(httpStatus.OK).json({ success: true, version: config.version })
}
