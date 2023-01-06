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

  describe("get quote candles", () => {

    it("success", async () => {
      await Promise.all(STOCKS.map(async stock => {
        const from = new Date(2021, 11, 10, 19, 30).getTime() / 1000
        const to = new Date(2021, 11, 10, 20, 0).getTime() / 1000

        const candles = await FinnHubService.getQuoteCandles(stock, from, to)

        candles.map(({ timestamp }) => {
          expect(timestamp).toBeGreaterThanOrEqual(from)
          expect(timestamp).toBeLessThanOrEqual(to)
        })

      }))
    })

  })
})
