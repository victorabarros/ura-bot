import { STOCKS } from "../../../src/controller/Tweet"
import FinnHubService from "../../../src/services/Finnhub"

describe("Test Services Finhub", () => {

  describe("get stock information", () => {
    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const resp = await FinnHubService.searchQuote(stock)
        // console.log(JSON.stringify(resp))
      })
    }))
  })


  describe("get stock news", () => {
    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const resp = await FinnHubService.searchNews(stock)
        console.log(resp.length, JSON.stringify(resp[0]))
      })
    }))
  })

  describe("get quote real time", () => {

    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const resp = await FinnHubService.getQuoteRealTime(stock)
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

  describe.skip("get quote candles", () => {
    Promise.all(STOCKS.map(async stock => {
      it(`success ${stock}`, async () => {
        const from = new Date(2021, 11, 10, 19, 30).getTime() / 1000
        const to = new Date(2021, 11, 10, 20, 0).getTime() / 1000

        const candles = await FinnHubService.getQuoteCandles(stock, from, to)

        candles.map(({ timestamp }) => {
          expect(timestamp).toBeGreaterThanOrEqual(from)
          expect(timestamp).toBeLessThanOrEqual(to)
        })
      })
    }))
  })

})
