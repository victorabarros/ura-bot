import FinnHubService from "../../../src/services/Finnhub"

describe("Test Services Finhub", () => {
  describe("get quote real time", () => {

    ["URA", "CCJ", "URNM", "DNN", "PDN"].map(stock =>
      it("success", async () => {
        const { symbol } = await FinnHubService.getQuoteRealTime(stock)
        expect(symbol).toBe(stock)
      })
    )
  })
})
