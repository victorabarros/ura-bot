import FinnHubService from "../../../src/services/Finnhub"

// axios Mock
jest.mock("axios", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: { get: jest.fn((address: string, options: unknown) => ({ data: { c: 28.61 } })) },
}))

describe("Test Services Finhub", () => {
  describe("get quote real time", () => {

    it("success", async () => {
      const { symbol, price } = await FinnHubService.getQuoteRealTime()
      expect(symbol).toBe("URA")
      expect(price).toBe("28.61")
    })
  })
})
