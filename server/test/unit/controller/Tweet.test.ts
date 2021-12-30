import Tweet, { evenningMessage, fridayMessage, morningMessage } from "../../../src/controller/Tweet"

const mockResponse = {
  status: (code: number) => ({ statusCode: code, ...mockResponse }),
  json: (body: unknown) => ({ data: body, ...mockResponse })
}

// Finnhub Mock
jest.mock("../../../src/services/Finnhub", () => ({
  __esModule: true,
  default: {
    getQuoteRealTime: jest.fn((symbol: string) =>
      ({ symbol: symbol || "URA", price: (Math.random() * 90).toFixed(2) })
    )
  },
}))

// Twitter Mock
jest.mock("../../../src/services/Twitter", () => ({
  __esModule: true,
  default: {
    writeTweet: jest.fn((msg: string) => {
      console.log(msg)
      return { id: "mock" }
    })
  }
}))

describe("Test Controller Tweet", () => {
  describe("post stock", () => {

    it("success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Tweet.postStock({} as any, mockResponse as any)
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
      const marketClosing = new Date(77400000) // 1970-01-01T21:30:00.000Z
      expect(evenningMessage(marketClosing).startsWith("Good Night")).toBeTruthy()
    })
  })

  describe("friday message", () => {
    it("success", async () => {
      const fridayMarketClosing = new Date(163800000) // 1970-01-02T21:30:00.000Z
      expect(fridayMessage(fridayMarketClosing)).toBe("Have a nice and sunny weekend")
      expect(evenningMessage(fridayMarketClosing)).toContain("Have a nice and sunny weekend")
    })
  })

})
