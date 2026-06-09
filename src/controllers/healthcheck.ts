import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"
import { checkFinnhubHealth } from "../services/finnhub"
import { checkReplicateHealth } from "../services/replicate"
import { uraBotXService } from "../services/x"
import { logIntegrationError } from "../http/errors"

/** Result of probing one upstream dependency. */
export type DependencyStatus = { ok: true } | { ok: false; error: string }

export type HealthcheckResponse = {
  success: boolean
  version: string
  dependencies: {
    finnhub: DependencyStatus
    replicate: DependencyStatus
    x: DependencyStatus
  }
}

const probe = async (integration: string, check: () => Promise<void>): Promise<DependencyStatus> => {
  try {
    await check()
    return { ok: true }
  } catch (err) {
    logIntegrationError("healthcheck", integration, err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * GET /healthcheck: probes Finnhub, Replicate, and X in parallel.
 * `200` when all are healthy; `503` when any dependency fails.
 */
export const healthcheck = async (_req: Request, res: Response): Promise<void> => {
  const settled = await Promise.allSettled([
    probe("finnhub", checkFinnhubHealth),
    probe("replicate", checkReplicateHealth),
    probe("x", () => uraBotXService.checkHealth()),
  ])
  const [finnhub, replicate, x] = settled.map((r) =>
    r.status === "fulfilled" ? r.value : { ok: false as const, error: String(r.reason) }
  ) as [DependencyStatus, DependencyStatus, DependencyStatus]

  const dependencies = { finnhub, replicate, x }
  const success = finnhub.ok && replicate.ok && x.ok

  const body: HealthcheckResponse = {
    success,
    version: config.version,
    dependencies,
  }

  res.status(success ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE).json(body)
}
