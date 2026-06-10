import { Request, Response } from "express"
import httpStatus from "http-status"
import config from "../config"
import { checkFinnhubHealth } from "../services/finnhub"
import { checkReplicateHealth } from "../services/replicate"
import { uraBotXService } from "../services/x"
import { checkCoinGeckoHealth } from "../services/coingecko"
import { checkBitviewHealth } from "../services/bitview"
import { checkAlternativeHealth } from "../services/alternative"
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
    coingecko: DependencyStatus
    bitview: DependencyStatus
    alternative: DependencyStatus
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
 * GET /healthcheck: probes all upstream dependencies in parallel.
 * `200` when all are healthy; `503` when any dependency fails.
 */
export const healthcheck = async (_req: Request, res: Response): Promise<void> => {
  const settled = await Promise.allSettled([
    probe("finnhub", checkFinnhubHealth),
    probe("replicate", checkReplicateHealth),
    probe("x", () => uraBotXService.checkHealth()),
    // probe("coingecko", checkCoinGeckoHealth), // To avoid rate limiting
    probe("bitview", checkBitviewHealth),
    probe("alternative", checkAlternativeHealth),
  ])
  const [finnhub, replicate, x, coingecko, bitview, alternative] = settled.map((r) =>
    r.status === "fulfilled" ? r.value : { ok: false as const, error: String(r.reason) }
  ) as [DependencyStatus, DependencyStatus, DependencyStatus, DependencyStatus, DependencyStatus, DependencyStatus]

  const dependencies = { finnhub, replicate, x, coingecko, bitview, alternative }
  const success = Object.values(dependencies).every((d) => d.ok)

  const body: HealthcheckResponse = {
    success,
    version: config.version,
    dependencies,
  }

  res.status(success ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE).json(body)
}
