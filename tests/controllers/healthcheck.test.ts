import { Request, Response } from "express"
import { healthcheck } from "../../src/controllers/healthcheck"

jest.mock("../../src/services/finnhub", () => ({
  checkFinnhubHealth: jest.fn(),
  getMarketHolidays: jest.fn(),
}))
jest.mock("../../src/services/replicate", () => ({
  checkReplicateHealth: jest.fn(),
  generateComment: jest.fn(),
}))
jest.mock("../../src/services/x", () => ({
  uraBotXService: { checkHealth: jest.fn() },
  bitcoinmetrxXService: { checkHealth: jest.fn() },
}))
jest.mock("../../src/services/coingecko", () => ({
  checkCoinGeckoHealth: jest.fn(),
  getBitcoinMarketData: jest.fn(),
}))
jest.mock("../../src/services/bitview", () => ({
  checkBitviewHealth: jest.fn(),
  getBitcoinOnchainData: jest.fn(),
}))
jest.mock("../../src/services/alternative", () => ({
  checkAlternativeHealth: jest.fn(),
  getFearGreedIndex: jest.fn(),
}))

import { checkFinnhubHealth } from "../../src/services/finnhub"
import { checkReplicateHealth } from "../../src/services/replicate"
import { uraBotXService } from "../../src/services/x"
import { checkCoinGeckoHealth } from "../../src/services/coingecko"
import { checkBitviewHealth } from "../../src/services/bitview"
import { checkAlternativeHealth } from "../../src/services/alternative"

const mockFinnhub = checkFinnhubHealth as jest.MockedFunction<typeof checkFinnhubHealth>
const mockReplicate = checkReplicateHealth as jest.MockedFunction<typeof checkReplicateHealth>
const mockCheckXHealth = uraBotXService.checkHealth as jest.Mock
const mockCoingecko = checkCoinGeckoHealth as jest.MockedFunction<typeof checkCoinGeckoHealth>
const mockBitview = checkBitviewHealth as jest.MockedFunction<typeof checkBitviewHealth>
const mockAlternative = checkAlternativeHealth as jest.MockedFunction<typeof checkAlternativeHealth>

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

const req = {} as Request

const resolveAll = () => {
  mockFinnhub.mockResolvedValue()
  mockReplicate.mockResolvedValue()
  mockCheckXHealth.mockResolvedValue(undefined)
  mockCoingecko.mockResolvedValue()
  mockBitview.mockResolvedValue()
  mockAlternative.mockResolvedValue()
}

beforeEach(() => {
  mockFinnhub.mockReset()
  mockReplicate.mockReset()
  mockCheckXHealth.mockReset()
  mockCoingecko.mockReset()
  mockBitview.mockReset()
  mockAlternative.mockReset()
})

describe("healthcheck", () => {
  it("returns 200 with success: true when all dependencies are healthy", async () => {
    resolveAll()

    const { res, status, json } = makeMockRes()
    await healthcheck(req, res)

    expect(status).toHaveBeenCalledWith(200)
    const body = json.mock.calls[0][0] as { success: boolean }
    expect(body.success).toBe(true)
  })

  it("returns 503 with success: false when one dependency fails", async () => {
    resolveAll()
    mockReplicate.mockRejectedValue(new Error("replicate down"))

    const { res, status, json } = makeMockRes()
    await healthcheck(req, res)

    expect(status).toHaveBeenCalledWith(503)
    const body = json.mock.calls[0][0] as { success: boolean; dependencies: { replicate: { ok: boolean; error?: string } } }
    expect(body.success).toBe(false)
    expect(body.dependencies.replicate).toMatchObject({ ok: false, error: "replicate down" })
  })

  it("marks only the failing dependency as not ok", async () => {
    resolveAll()
    mockFinnhub.mockRejectedValue(new Error("timeout"))

    const { res, json } = makeMockRes()
    await healthcheck(req, res)

    type Deps = { finnhub: { ok: boolean }; replicate: { ok: boolean }; x: { ok: boolean }; coingecko: { ok: boolean }; bitview: { ok: boolean }; alternative: { ok: boolean } }
    const body = json.mock.calls[0][0] as { dependencies: Deps }
    expect(body.dependencies.finnhub.ok).toBe(false)
    expect(body.dependencies.replicate.ok).toBe(true)
    expect(body.dependencies.x.ok).toBe(true)
    expect(body.dependencies.coingecko.ok).toBe(true)
    expect(body.dependencies.bitview.ok).toBe(true)
    expect(body.dependencies.alternative.ok).toBe(true)
  })

  it("returns 503 when a new bitcoin dependency fails", async () => {
    resolveAll()
    mockBitview.mockRejectedValue(new Error("bitview down"))

    const { res, status, json } = makeMockRes()
    await healthcheck(req, res)

    expect(status).toHaveBeenCalledWith(503)
    const body = json.mock.calls[0][0] as { dependencies: { bitview: { ok: boolean; error?: string } } }
    expect(body.dependencies.bitview).toMatchObject({ ok: false, error: "bitview down" })
  })

  it("response always includes version", async () => {
    resolveAll()

    const { res, json } = makeMockRes()
    await healthcheck(req, res)

    const body = json.mock.calls[0][0] as { version: string }
    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
  })
})
