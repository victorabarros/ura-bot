import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"

/** Unauthenticated liveness check; returns service version. */
export async function heartbeat(_req: Request, res: Response): Promise<void> {
  console.log("[heartbeat] pong")
  res.status(httpStatus.OK).json({ success: true, version: config.version })
}
