const mockGet = jest.fn()

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  create: jest.fn(() => ({ get: mockGet })),
}))

import { getBitcoinMarketData } from "../../src/services/coingecko"

beforeEach(() => mockGet.mockReset())

describe("getBitcoinMarketData", () => {
  it("returns parsed market data on success", async () => {
    mockGet.mockResolvedValue({
      data: {
        bitcoin: {
          usd: 105432,
          usd_24h_change: 2.31,
          usd_market_cap: 2_090_000_000_000,
          usd_24h_vol: 48_000_000_000,
        },
      },
    })

    const result = await getBitcoinMarketData()

    expect(result.priceUsd).toBe(105432)
    expect(result.change24hPct).toBeCloseTo(2.31)
    expect(result.marketCapUsd).toBe(2_090_000_000_000)
    expect(result.volume24hUsd).toBe(48_000_000_000)
  })

  it("throws when axios.get rejects", async () => {
    mockGet.mockRejectedValue(new Error("network error"))

    await expect(getBitcoinMarketData()).rejects.toThrow("network error")
  })
})
