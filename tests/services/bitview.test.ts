const mockGet = jest.fn()

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  create: jest.fn(() => ({ get: mockGet })),
}))

import { getBitcoinOnchainData } from "../../src/services/bitview"

beforeEach(() => mockGet.mockReset())

describe("getBitcoinOnchainData", () => {
  it("returns mvrv and realized price on success", async () => {
    mockGet.mockResolvedValue({
      data: [{ data: [2.41] }, { data: [53549.19] }],
    })

    const result = await getBitcoinOnchainData()

    expect(result.mvrv).toBeCloseTo(2.41)
    expect(result.realizedPriceUsd).toBeCloseTo(53549.19)
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
