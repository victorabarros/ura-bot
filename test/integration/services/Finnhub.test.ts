import { STOCKS } from "../../../src/controller/Uranium"
import { finnHub } from "../../../src/services"

describe("Test Services Finhub", () => {

  describe("get stock news", () => {
    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const resp = await finnHub.searchNews(stock)
        console.log("finnHub.searchNews", resp.length)
      })
    }))
  })

  describe("get quote real time", () => {

    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const resp = await finnHub.getQuoteRealTime(stock)
        const { symbol, price, highPrice, lowPrice, openPrice, previousClosePrice } = resp

        expect(symbol).toBe(stock)
        expect(price).toBeGreaterThan(0)
        expect(highPrice).toBeGreaterThan(0)
        expect(lowPrice).toBeGreaterThan(0)
        expect(openPrice).toBeGreaterThan(0)
        expect(previousClosePrice).toBeGreaterThan(0)
      })
    }))
  })

})
