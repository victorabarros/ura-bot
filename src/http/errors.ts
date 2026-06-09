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

/** Extracts a structured API detail payload from known error shapes. */
function apiDetail(err: unknown): unknown | undefined {
  if (!err || typeof err !== "object") return undefined
  // twitter-api-v2 ApiResponseError
  if ("data" in err && err.data !== undefined) return err.data
  // Axios
  if (axios.isAxiosError(err) && err.response?.data !== undefined) return err.response.data
  return undefined
}

/** Logs an upstream integration failure with full API response detail when available. */
export function logIntegrationError(route: string, integration: string, err: unknown): void {
  const msg = errorMessage(err)
  const detail = apiDetail(err)
  const code = err && typeof err === "object" && "code" in err ? (err as { code?: unknown }).code : undefined
  const suffix = [
    code !== undefined ? `code=${code}` : undefined,
    detail !== undefined ? JSON.stringify(detail) : undefined,
  ]
    .filter(Boolean)
    .join(" — ")
  console.error(`[${route}] ${integration}: ${msg}${suffix ? ` — ${suffix}` : ""}`)
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
