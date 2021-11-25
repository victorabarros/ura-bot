import { STOCKS } from "../../../src/controller/Tweet"
import FinnHubService from "../../../src/services/Finnhub"

describe("Test Services Finhub", () => {
  describe("get quote real time", () => {

    it("success", async () => {
      await Promise.all(STOCKS.map(async stock => {
        const { symbol, price } = await FinnHubService.getQuoteRealTime(stock)
        expect(symbol).toBe(stock)
        expect(price).toBeGreaterThan(0)
      }))
    })

  })
})
