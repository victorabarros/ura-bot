import { Request, Response } from "express"
import { postUraNews } from "../../src/controllers/news"

jest.mock("../../src/services/finnhub", () => ({
  searchNews: jest.fn(),
  getMarketHolidays: jest.fn(),
  checkFinnhubHealth: jest.fn(),
}))
jest.mock("../../src/services/replicate", () => ({
  generateNewsComment: jest.fn(),
  checkReplicateHealth: jest.fn(),
}))
jest.mock("../../src/fanout", () => ({
  fanout: jest.fn(),
  fanoutHadSuccess: jest.fn(),
  buildPostApiResponse: jest.fn(),
  // fanoutAll not used by news controller but keep consistent
  fanoutAll: jest.fn(),
}))
jest.mock("../../src/controllers/targets", () => ({
  getSocialTargets: jest.fn().mockReturnValue([]),
}))

import { searchNews } from "../../src/services/finnhub"
import { generateNewsComment } from "../../src/services/replicate"
import { fanout, fanoutHadSuccess, buildPostApiResponse } from "../../src/fanout"
import { NewsItem } from "../../src/services/finnhub"

const mockSearchNews = searchNews as jest.MockedFunction<typeof searchNews>
const mockGenerateNewsComment = generateNewsComment as jest.MockedFunction<typeof generateNewsComment>
const mockFanout = fanout as jest.MockedFunction<typeof fanout>
const mockFanoutHadSuccess = fanoutHadSuccess as jest.MockedFunction<typeof fanoutHadSuccess>
const mockBuildPostApiResponse = buildPostApiResponse as jest.MockedFunction<typeof buildPostApiResponse>

function makeMockRes() {
  const json = jest.fn().mockReturnThis()
  const send = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json, send })
  return { res: { status, json, send } as unknown as Response, status, json, send }
}

function makeNewsItem(): NewsItem {
  return {
    id: 1,
    headline: "Uranium Demand Rises",
    summary: "Market summary here",
    url: "https://news.example.com/uranium",
    source: "Reuters",
    category: "company",
    related: "CCJ",
    image: "",
    datetime: Date.now(),
  }
}

const req = {} as Request

beforeEach(() => {
  jest.clearAllMocks()
  mockFanout.mockResolvedValue([{ platform: "X", success: true, id: "tweet-1" }])
  mockFanoutHadSuccess.mockReturnValue(true)
  mockBuildPostApiResponse.mockReturnValue({ created_at: new Date(), tweet_id: "tweet-1" })
})

describe("postUraNews", () => {
  it("returns 200 when news is found, comment generated, and post succeeds", async () => {
    mockSearchNews.mockResolvedValue([makeNewsItem()])
    mockGenerateNewsComment.mockResolvedValue("Great uranium news!")

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(mockGenerateNewsComment).toHaveBeenCalled()
    expect(mockFanout).toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(200)
  })

  it("returns 503 when Finnhub is rate-limited", async () => {
    const rateLimitErr = Object.assign(new Error("429"), { isAxiosError: true, response: { status: 429 } })
    mockSearchNews.mockRejectedValue(rateLimitErr)

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(503)
  })

  it("returns 204 when no news articles are found across all tickers and windows", async () => {
    mockSearchNews.mockResolvedValue([])

    const { res, status, send } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(204)
    expect(send).toHaveBeenCalled()
  })

  it("returns 503 when all Finnhub calls error (no successful call)", async () => {
    mockSearchNews.mockRejectedValue(new Error("network error"))

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(503)
  })

  it("returns 503 when Replicate comment generation fails", async () => {
    mockSearchNews.mockResolvedValue([makeNewsItem()])
    mockGenerateNewsComment.mockRejectedValue(new Error("model unavailable"))

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(503)
  })

  it("returns 502 when all social targets fail to post", async () => {
    mockSearchNews.mockResolvedValue([makeNewsItem()])
    mockGenerateNewsComment.mockResolvedValue("comment")
    mockFanout.mockResolvedValue([{ platform: "X", success: false, error: "auth failed" }])
    mockFanoutHadSuccess.mockReturnValue(false)

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(502)
  })
})
