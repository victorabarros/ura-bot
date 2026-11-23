const mockGet = jest.fn()

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  create: jest.fn(() => ({ get: mockGet })),
}))

import { checkBitviewHealth, getBitcoinOnchainData } from "../../src/services/bitview"

const latestDailyParams = {
  index: "day1",
  series: "mvrv,realized_price,price_sma_200d,price_sma_55d",
  start: -1,
}

beforeEach(() => mockGet.mockReset())

describe("getBitcoinOnchainData", () => {
  it("requests the day1 index and reads series in query order", async () => {
    mockGet.mockResolvedValue({
      data: [
        { version: 1, index: "day1", type: "Multiple", start: 6535, end: 6536, data: [1.1860259] },
        { version: 2, index: "day1", type: "Dollars", start: 6535, end: 6536, data: [53164.35] },
        { version: 3, index: "day1", type: "Dollars", start: 6535, end: 6536, data: [72348.3] },
        { version: 4, index: "day1", type: "Dollars", start: 6535, end: 6536, data: [77219.54] },
      ],
    })

    const result = await getBitcoinOnchainData()

    expect(mockGet).toHaveBeenCalledWith("/api/series/bulk", { params: latestDailyParams })
    expect(result.mvrv).toBeCloseTo(1.1860259)
    expect(result.realizedPriceUsd).toBeCloseTo(53164.35)
    expect(result.sma200dUsd).toBeCloseTo(72348.3)
    expect(result.sma55dUsd).toBeCloseTo(77219.54)
  })

  it("throws when response is missing expected series", async () => {
    mockGet.mockResolvedValue({ data: [] })

    await expect(getBitcoinOnchainData()).rejects.toThrow("missing expected series")
  })

  it("throws when axios.get rejects", async () => {
    mockGet.mockRejectedValue(new Error("timeout"))

    await expect(getBitcoinOnchainData()).rejects.toThrow("timeout")
  })
})

describe("checkBitviewHealth", () => {
  it("passes when the daily series query returns numbers", async () => {
    mockGet.mockResolvedValue({
      data: [{ data: [1.18] }, { data: [53164] }, { data: [72348] }, { data: [77219] }],
    })

    await expect(checkBitviewHealth()).resolves.toBeUndefined()
    expect(mockGet).toHaveBeenCalledWith("/api/series/bulk", { params: latestDailyParams })
  })

  it("fails when a series value is not a finite number", async () => {
    mockGet.mockResolvedValue({
      data: [{ data: [Number.NaN] }, { data: [53164] }, { data: [72348] }, { data: [77219] }],
    })

    await expect(checkBitviewHealth()).rejects.toThrow("non-numeric")
  })

  it("fails when the daily series query is rejected", async () => {
    mockGet.mockRejectedValue(new Error("Request failed with status code 400"))

    await expect(checkBitviewHealth()).rejects.toThrow("400")
    expect(mockGet).toHaveBeenCalledWith("/api/series/bulk", { params: latestDailyParams })
    expect(mockGet).not.toHaveBeenCalledWith("/health")
  })
})
