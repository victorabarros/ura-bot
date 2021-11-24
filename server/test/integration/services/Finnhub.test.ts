import FinnHubService from "../../../src/services/Finnhub"

describe("Test Services Finhub", () => {
  describe("get quote real time", () => {

    it("success", async () => {
      const stocks = ["URA", "CCJ", "URNM", "DNN", "PDN", "SRUUF"]
      await Promise.all(stocks.map(FinnHubService.getQuoteRealTime))
    })

  })
})
