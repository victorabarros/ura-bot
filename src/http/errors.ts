import { Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import { FanoutResult } from "../fanout"

/** Client-facing error body for failed action routes. */
export type ApiErrorBody = {
  error: string
  integration: string
}

/** Normalizes unknown thrown values to a log-safe message. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Logs an upstream integration failure with optional API response detail. */
export function logIntegrationError(route: string, integration: string, err: unknown): void {
  const msg = errorMessage(err)
  if (axios.isAxiosError(err) && err.response?.data !== undefined) {
    console.error(`[${route}] ${integration}: ${msg} — ${JSON.stringify(err.response.data)}`)
    return
  }
  console.error(`[${route}] ${integration}: ${msg}`)
}

/** `503` when an upstream dependency is unavailable or rate-limited. */
export function respondUpstreamUnavailable(
  res: Response,
  integration: string,
  message: string
): void {
  res.status(httpStatus.SERVICE_UNAVAILABLE).json({ error: message, integration } satisfies ApiErrorBody)
}

/** `500` for unexpected internal failures or unrecoverable data fetch. */
export function respondInternalError(
  res: Response,
  integration: string,
  message: string
): void {
  res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: message, integration } satisfies ApiErrorBody)
}

/** `502` when every configured social target failed to publish. */
export function respondSocialPublishFailed(res: Response, results: FanoutResult[]): void {
  const detail = results.map((r) => `${r.platform}: ${r.error ?? "unknown"}`).join("; ")
  console.error(`[fanout] All platforms failed: ${detail}`)
  res.status(httpStatus.BAD_GATEWAY).json({
    error: "All social platforms failed to publish",
    integration: "social",
  } satisfies ApiErrorBody)
}
