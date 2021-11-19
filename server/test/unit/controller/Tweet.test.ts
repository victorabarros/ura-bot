import Tweet from "../../../src/controller/Tweet"

const mockResponse = {
  status: (code: number) => ({ statusCode: code, ...mockResponse }),
  json: (body: unknown) => ({ data: body, ...mockResponse })
}

jest.mock("../../../src/services/Finnhub", () => ({
  __esModule: true,
  default: { getQuoteRealTime: jest.fn((symbol: string) => ({ symbol: symbol || "URA", price: 30.85 })) },
}))

jest.mock("../../../src/services/Twitter", () => ({
  __esModule: true,
  default: {
    writeTweet: jest.fn((msg: string) => {
      console.log(msg)
      return { id: "mock" }
    })
  },
}))

describe("Test Controller Tweet", () => {
  describe("post stock", () => {

    it("success", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Tweet.postStock({} as any, mockResponse as any)
    })
  })
})
