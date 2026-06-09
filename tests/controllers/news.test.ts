import { Request, Response } from "express"
import { postUraNews } from "../../src/controllers/news"

jest.mock("../../src/services/finnhub", () => ({
  searchNews: jest.fn(),
  getMarketHolidays: jest.fn(),
  checkFinnhubHealth: jest.fn(),
}))
jest.mock("../../src/services/replicate", () => ({
  generateComment: jest.fn(),
  generateImage: jest.fn(),
  checkReplicateHealth: jest.fn(),
}))
jest.mock("../../src/fanout", () => ({
  fanout: jest.fn(),
  fanoutHadSuccess: jest.fn(),
  buildPostApiResponse: jest.fn(),
  fanoutAll: jest.fn(),
}))
jest.mock("../../src/controllers/targets", () => ({
  SOCIAL_TARGETS: [],
}))

import { searchNews } from "../../src/services/finnhub"
import { generateComment, generateImage } from "../../src/services/replicate"
import { fanout, fanoutHadSuccess, buildPostApiResponse } from "../../src/fanout"
import { NewsItem } from "../../src/services/finnhub"

const mockSearchNews = searchNews as jest.MockedFunction<typeof searchNews>
const mockGenerateComment = generateComment as jest.MockedFunction<typeof generateComment>
const mockGenerateImage = generateImage as jest.MockedFunction<typeof generateImage>
const mockFanout = fanout as jest.MockedFunction<typeof fanout>
const mockFanoutHadSuccess = fanoutHadSuccess as jest.MockedFunction<typeof fanoutHadSuccess>
const mockBuildPostApiResponse = buildPostApiResponse as jest.MockedFunction<typeof buildPostApiResponse>

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const send = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json, send })
  return { res: { status, json, send } as unknown as Response, status, json, send }
}

const makeNewsItem = (): NewsItem => ({
  id: 1,
  headline: "Uranium Demand Rises",
  summary: "Market summary here",
  url: "https://news.example.com/uranium",
  source: "Reuters",
  category: "company",
  related: "CCJ",
  image: "",
  datetime: Date.now(),
})

const req = {} as Request

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Math, "random").mockReturnValue(0.5) // above 20% threshold — no image by default
  mockFanout.mockResolvedValue([{ platform: "X", success: true, id: "tweet-1" }])
  mockFanoutHadSuccess.mockReturnValue(true)
  mockBuildPostApiResponse.mockReturnValue({ created_at: new Date(), tweet_id: "tweet-1" })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("postUraNews", () => {
  it("returns 200 when news is found, comment generated, and post succeeds", async () => {
    mockSearchNews.mockResolvedValue([makeNewsItem()])
    mockGenerateComment.mockResolvedValue("Great uranium news!")

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(mockGenerateComment).toHaveBeenCalled()
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
    mockGenerateComment.mockRejectedValue(new Error("model unavailable"))

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(503)
  })

  it("returns 502 when all social targets fail to post", async () => {
    mockSearchNews.mockResolvedValue([makeNewsItem()])
    mockGenerateComment.mockResolvedValue("comment")
    mockFanout.mockResolvedValue([{ platform: "X", success: false, error: "auth failed" }])
    mockFanoutHadSuccess.mockReturnValue(false)

    const { res, status } = makeMockRes()
    await postUraNews(req, res)

    expect(status).toHaveBeenCalledWith(502)
  })

  describe("20% image generation", () => {
    it("generates an image and passes it to fanout when random roll is below 0.2", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.1)
      mockSearchNews.mockResolvedValue([makeNewsItem()])
      mockGenerateComment.mockResolvedValue("comment")
      mockGenerateImage.mockResolvedValue("https://replicate.delivery/news.jpg")

      const { res, status } = makeMockRes()
      await postUraNews(req, res)

      expect(mockGenerateImage).toHaveBeenCalledWith(expect.stringContaining("Uranium Demand Rises"))
      const [, , imageUrlArg] = mockFanout.mock.calls[0]
      expect(imageUrlArg).toBe("https://replicate.delivery/news.jpg")
      expect(status).toHaveBeenCalledWith(200)
    })

    it("skips image generation when random roll is 0.2 or above", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.2)
      mockSearchNews.mockResolvedValue([makeNewsItem()])
      mockGenerateComment.mockResolvedValue("comment")

      const { res, status } = makeMockRes()
      await postUraNews(req, res)

      expect(mockGenerateImage).not.toHaveBeenCalled()
      const [, , imageUrlArg] = mockFanout.mock.calls[0]
      expect(imageUrlArg).toBeUndefined()
      expect(status).toHaveBeenCalledWith(200)
    })

    it("still posts without image when image generation fails", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.1)
      mockSearchNews.mockResolvedValue([makeNewsItem()])
      mockGenerateComment.mockResolvedValue("comment")
      mockGenerateImage.mockRejectedValue(new Error("model timeout"))

      const { res, status } = makeMockRes()
      await postUraNews(req, res)

      const [, , imageUrlArg] = mockFanout.mock.calls[0]
      expect(imageUrlArg).toBeUndefined()
      expect(status).toHaveBeenCalledWith(200)
    })
  })
})
