const mockResponse = {
  status: (code: number) => ({ statusCode: code, ...mockResponse }),
  json: (body: unknown) => ({ data: body, ...mockResponse })
}

// Finnhub Mock
jest.mock("../../../src/services", () => ({
  __esModule: true,
  default: {
    getQuoteRealTime: jest.fn((symbol: string) => {
      const p = (Math.random() * 90)
      return {
        symbol: symbol || "URA",
        price: p.toFixed(2),
        openPrice: (((-1) ** Math.random()) * p * (1 + Math.random())).toFixed(2),
      }
    })
  },
}))

// Twitter Mock
jest.mock("../../../src/services", () => ({
  __esModule: true,
  default: {
    UraTwitterService: {
      writeTweet: jest.fn((msg: string) => {
        console.log(msg)
        return { id: "mock" }
      })
    }
  }
}))
