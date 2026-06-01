import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"
import { checkFinnhubHealth } from "../services/finnhub"
import { checkReplicateHealth } from "../services/replicate"
import { checkXHealth } from "../services/x"
import { errorMessage, logIntegrationError } from "../http/errors"

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

async function probe(integration: string, check: () => Promise<void>): Promise<DependencyStatus> {
  try {
    await check()
    return { ok: true }
  } catch (err) {
    logIntegrationError("healthcheck", integration, err)
    return { ok: false, error: errorMessage(err) }
  }
}

/**
 * GET /healthcheck: probes Finnhub, Replicate, and X in parallel.
 * `200` when all are healthy; `503` when any dependency fails.
 */
export async function healthcheck(_req: Request, res: Response): Promise<void> {
  const [finnhub, replicate, x] = await Promise.all([
    probe("finnhub", checkFinnhubHealth),
    probe("replicate", checkReplicateHealth),
    probe("x", checkXHealth),
  ])

  const dependencies = { finnhub, replicate, x }
  const success = finnhub.ok && replicate.ok && x.ok

  const body: HealthcheckResponse = {
    success,
    version: config.version,
    dependencies,
  }

  res.status(success ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE).json(body)
}
