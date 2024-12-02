import { finnHub } from "../../../src/services"

// axios Mock
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get: jest.fn((address: string, options: unknown) => {
      if (address.endsWith("quote")) return {
        data: {
          c: 28.61,
          h: 32.49,
          l: 17.19,
          o: 21.03,
          pc: 21.02,
        }
      }
      if (address.endsWith("stock/candle")) return {
        data: {
          s: "ok",
          c: [217.68, 221.03, 219.89],
          h: [222.49, 221.5, 220.94],
          l: [217.19, 217.1402, 218.83],
          o: [221.03, 218.55, 220],
          t: [1639164600, 1639165000, 1639165600],
          v: [33463820, 24018876, 20730608]
        }
      }
    })
  },
}))

describe("Test Services Finhub", () => {
  describe("get quote real time", () => {

    it("success", async () => {
      const { symbol, price, highPrice, lowPrice } = await finnHub.getQuoteRealTime("URA")
      expect(symbol).toBe("URA")
      expect(price).toBe(28.61)
      expect(highPrice).toBeGreaterThan(price)
      expect(price).toBeGreaterThan(lowPrice)
    })
  })

})
