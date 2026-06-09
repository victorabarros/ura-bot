const mockGet = jest.fn()

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  create: jest.fn(() => ({ get: mockGet })),
}))

import { getBitcoinOnchainData } from "../../src/services/bitview"

beforeEach(() => mockGet.mockReset())

describe("getBitcoinOnchainData", () => {
  it("returns mvrv, realized price, 200d SMA, and 55d SMA on success", async () => {
    mockGet.mockResolvedValue({
      data: [{ data: [2.41] }, { data: [53549.19] }, { data: [78198.59] }, { data: [75752.34] }],
    })

    const result = await getBitcoinOnchainData()

    expect(result.mvrv).toBeCloseTo(2.41)
    expect(result.realizedPriceUsd).toBeCloseTo(53549.19)
    expect(result.sma200dUsd).toBeCloseTo(78198.59)
    expect(result.sma55dUsd).toBeCloseTo(75752.34)
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
