import Tweet, { evenningMessage, fridayMessage, morningMessage } from "../../../src/controller/Uranium"

const mockResponse = {
  status: (code: number) => ({ statusCode: code, ...mockResponse }),
  json: (body: unknown) => ({ data: body, ...mockResponse })
}

// Finnhub Mock
jest.mock("../../../src/services/Finnhub", () => ({
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
jest.mock("../../../src/services/Twitter", () => ({
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

describe("Test Controller Tweet", () => {
  describe("post stock", () => {

    it("success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Tweet.postUraStock({} as any, mockResponse as any)
    })
  })

  describe("is first", () => {
    it("success", async () => {
      const marketOpenning = new Date(50400000) // 1970-01-01T14:00:00.000Z
      expect(morningMessage(marketOpenning).startsWith("Good Morning")).toBeTruthy()
    })
  })

  describe("is last", () => {
    it("success", async () => {
      const marketClosing = new Date(75600000) // 1970-01-01T21:00:00.000Z
      expect(evenningMessage(marketClosing).startsWith("Good Night")).toBeTruthy()
    })
  })

  describe("friday message", () => {
    it("success", async () => {
      const fridayMarketClosing = new Date(162000000) // 1970-01-02T21:00:00.000Z
      expect(fridayMessage(fridayMarketClosing)).toBe("Have a nice and sunny weekend")
      expect(evenningMessage(fridayMarketClosing)).toContain("Have a nice and sunny weekend")
    })
  })

})
