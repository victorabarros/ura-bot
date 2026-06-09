const mockGet = jest.fn()

jest.mock("axios", () => ({
  ...jest.requireActual("axios"),
  create: jest.fn(() => ({ get: mockGet })),
}))

import { getFearGreedIndex } from "../../src/services/feargreed"

beforeEach(() => mockGet.mockReset())

describe("getFearGreedIndex", () => {
  it("returns parsed fear & greed data on success", async () => {
    mockGet.mockResolvedValue({
      data: { data: [{ value: "72", value_classification: "Greed" }] },
    })

    const result = await getFearGreedIndex()

    expect(result.value).toBe(72)
    expect(result.classification).toBe("Greed")
  })

  it("throws when data array is empty", async () => {
    mockGet.mockResolvedValue({ data: { data: [] } })

    await expect(getFearGreedIndex()).rejects.toThrow("no data")
  })

  it("throws when axios.get rejects", async () => {
    mockGet.mockRejectedValue(new Error("service unavailable"))

    await expect(getFearGreedIndex()).rejects.toThrow("service unavailable")
  })
})
