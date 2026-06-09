import { Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import { FanoutResult } from "../domain/fanout"

/** Client-facing error body for failed action routes. */
export type ApiErrorBody = {
  error: string
  integration: string
}

/** Logs an upstream integration failure with full API response detail when available. */
export const logIntegrationError = (route: string, integration: string, err: unknown): void => {
  const msg = err instanceof Error ? err.message : String(err)

  let detail: unknown | undefined
  if (err && typeof err === "object") {
    if ("data" in err && (err as { data?: unknown }).data !== undefined) detail = (err as { data?: unknown }).data
    else if (axios.isAxiosError(err) && err.response?.data !== undefined) detail = err.response.data
  }

  const code = err && typeof err === "object" && "code" in err ? (err as { code?: unknown }).code : undefined
  const suffix = [
    code !== undefined ? `code=${code}` : undefined,
    detail !== undefined ? JSON.stringify(detail) : undefined,
  ]
    .filter(Boolean)
    .join(" — ")
  console.error(`[${route}] ${integration}: ${msg}${suffix ? ` — ${suffix}` : ""}`)
}

/** `502` when every configured social target failed to publish. */
export const respondSocialPublishFailed = (res: Response, results: FanoutResult[]): void => {
  const detail = results.map((r) => `${r.platform}: ${r.error ?? "unknown"}`).join("; ")
  console.error(`[fanout] All platforms failed: ${detail}`)
  res.status(httpStatus.BAD_GATEWAY).json({
    error: "All social platforms failed to publish",
    integration: "social",
  } satisfies ApiErrorBody)
}
