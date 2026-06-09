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
}))

import { checkFinnhubHealth } from "../../src/services/finnhub"
import { checkReplicateHealth } from "../../src/services/replicate"
import { uraBotXService } from "../../src/services/x"

const mockFinnhub = checkFinnhubHealth as jest.MockedFunction<typeof checkFinnhubHealth>
const mockReplicate = checkReplicateHealth as jest.MockedFunction<typeof checkReplicateHealth>
const mockCheckXHealth = uraBotXService.checkHealth as jest.Mock

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

const req = {} as Request

beforeEach(() => {
  mockFinnhub.mockReset()
  mockReplicate.mockReset()
  mockCheckXHealth.mockReset()
})

describe("healthcheck", () => {
  it("returns 200 with success: true when all dependencies are healthy", async () => {
    mockFinnhub.mockResolvedValue()
    mockReplicate.mockResolvedValue()
    mockCheckXHealth.mockResolvedValue(undefined)

    const { res, status, json } = makeMockRes()
    await healthcheck(req, res)

    expect(status).toHaveBeenCalledWith(200)
    const body = json.mock.calls[0][0] as { success: boolean }
    expect(body.success).toBe(true)
  })

  it("returns 503 with success: false when one dependency fails", async () => {
    mockFinnhub.mockResolvedValue()
    mockReplicate.mockRejectedValue(new Error("replicate down"))
    mockCheckXHealth.mockResolvedValue(undefined)

    const { res, status, json } = makeMockRes()
    await healthcheck(req, res)

    expect(status).toHaveBeenCalledWith(503)
    const body = json.mock.calls[0][0] as { success: boolean; dependencies: { replicate: { ok: boolean; error?: string } } }
    expect(body.success).toBe(false)
    expect(body.dependencies.replicate).toMatchObject({ ok: false, error: "replicate down" })
  })

  it("marks only the failing dependency as not ok", async () => {
    mockFinnhub.mockRejectedValue(new Error("timeout"))
    mockReplicate.mockResolvedValue()
    mockCheckXHealth.mockResolvedValue(undefined)

    const { res, json } = makeMockRes()
    await healthcheck(req, res)

    const body = json.mock.calls[0][0] as { dependencies: { finnhub: { ok: boolean }; replicate: { ok: boolean }; x: { ok: boolean } } }
    expect(body.dependencies.finnhub.ok).toBe(false)
    expect(body.dependencies.replicate.ok).toBe(true)
    expect(body.dependencies.x.ok).toBe(true)
  })

  it("response always includes version", async () => {
    mockFinnhub.mockResolvedValue()
    mockReplicate.mockResolvedValue()
    mockCheckXHealth.mockResolvedValue(undefined)

    const { res, json } = makeMockRes()
    await healthcheck(req, res)

    const body = json.mock.calls[0][0] as { version: string }
    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
  })
})
