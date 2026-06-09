import { Request, Response } from "express"
import { postUraStock } from "../../src/controllers/stocks"

// Mock all external dependencies
jest.mock("../../src/services/finnhub", () => ({
  getQuote: jest.fn(),
  getMarketHolidays: jest.fn(),
  checkFinnhubHealth: jest.fn(),
}))
jest.mock("../../src/services/replicate", () => ({
  generateHolidayImage: jest.fn(),
  generateNewsComment: jest.fn(),
  generateTrendingComment: jest.fn(),
  checkReplicateHealth: jest.fn(),
}))
jest.mock("../../src/domain/holidays", () => ({
  getHolidayEntry: jest.fn(),
}))
jest.mock("../../src/fanout", () => ({
  fanoutAll: jest.fn(),
  fanoutHadSuccess: jest.fn(),
  buildPostApiResponse: jest.fn(),
}))
jest.mock("../../src/controllers/targets", () => ({
  getSocialTargets: jest.fn().mockReturnValue([]),
}))

import { getQuote } from "../../src/services/finnhub"
import { generateHolidayImage } from "../../src/services/replicate"
import { getHolidayEntry } from "../../src/domain/holidays"
import { fanoutAll, fanoutHadSuccess, buildPostApiResponse } from "../../src/fanout"
import { Quote } from "../../src/services/finnhub"

const mockGetQuote = getQuote as jest.MockedFunction<typeof getQuote>
const mockGenerateHolidayImage = generateHolidayImage as jest.MockedFunction<typeof generateHolidayImage>
const mockGetHolidayEntry = getHolidayEntry as jest.MockedFunction<typeof getHolidayEntry>
const mockFanoutAll = fanoutAll as jest.MockedFunction<typeof fanoutAll>
const mockFanoutHadSuccess = fanoutHadSuccess as jest.MockedFunction<typeof fanoutHadSuccess>
const mockBuildPostApiResponse = buildPostApiResponse as jest.MockedFunction<typeof buildPostApiResponse>

function makeMockRes() {
  const json = jest.fn().mockReturnThis()
  const send = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json, send })
  return { res: { status, json, send } as unknown as Response, status, json, send }
}

function makeQuote(symbol: string): Quote {
  return { symbol, price: 10, openPrice: 9, highPrice: 11, lowPrice: 8, previousClosePrice: 9 }
}

const req = {} as Request

beforeEach(() => {
  jest.clearAllMocks()
  mockGetHolidayEntry.mockResolvedValue(undefined)
  mockGenerateHolidayImage.mockResolvedValue("https://replicate.delivery/holiday.jpg")
  mockFanoutAll.mockResolvedValue([[{ platform: "X", success: true, id: "tweet-1" }]])
  mockFanoutHadSuccess.mockReturnValue(true)
  mockBuildPostApiResponse.mockReturnValue({ created_at: new Date(), tweet_id: "tweet-1" })
})

describe("postUraStock", () => {
  describe("holiday branch", () => {
    it("passes image URL as third arg to fanoutAll and returns 200", async () => {
      mockGetHolidayEntry.mockResolvedValue({
        eventName: "Independence Day",
        atDate: "2026-07-04",
        tradingHour: "",
        message: "Happy 4th!",
      })

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(mockGenerateHolidayImage).toHaveBeenCalledWith("Independence Day")
      const [, , imageUrlArg] = mockFanoutAll.mock.calls[0]
      expect(imageUrlArg).toBe("https://replicate.delivery/holiday.jpg")
      expect(status).toHaveBeenCalledWith(200)
    })

    it("still posts holiday message when image generation fails", async () => {
      mockGetHolidayEntry.mockResolvedValue({
        eventName: "Labor Day",
        atDate: "2026-09-07",
        tradingHour: "",
      })
      mockGenerateHolidayImage.mockRejectedValue(new Error("Replicate timeout"))

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(mockFanoutAll).toHaveBeenCalled()
      const [, , imageUrlArg] = mockFanoutAll.mock.calls[0]
      expect(imageUrlArg).toBeUndefined()
      expect(status).toHaveBeenCalledWith(200)
    })

    it("returns 502 when holiday fan-out fails", async () => {
      mockIsHoliday.mockResolvedValue(true)
      mockGetHolidayEntry.mockResolvedValue({
        eventName: "Labor Day",
        atDate: "2026-09-07",
        tradingHour: "",
      })
      mockFanoutHadSuccess.mockReturnValue(false)
      mockFanoutAll.mockResolvedValue([[{ platform: "X", success: false, error: "fail" }]])

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(status).toHaveBeenCalledWith(502)
    })
  })

  describe("normal quote roundup", () => {
    it("returns 200 when quotes are fetched and fan-out succeeds", async () => {
      mockGetQuote.mockResolvedValue(makeQuote("CCJ"))

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(status).toHaveBeenCalledWith(200)
    })

    it("returns 503 when all quotes are rate-limited", async () => {
      const rateLimitErr = Object.assign(new Error("429"), { isAxiosError: true, response: { status: 429 } })
      mockGetQuote.mockRejectedValue(rateLimitErr)

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(status).toHaveBeenCalledWith(503)
    })

    it("returns 503 when all quotes fail (non-rate-limit)", async () => {
      mockGetQuote.mockRejectedValue(new Error("network error"))

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(status).toHaveBeenCalledWith(503)
    })

    it("returns 502 when quotes succeed but all social targets fail", async () => {
      mockGetQuote.mockResolvedValue(makeQuote("CCJ"))
      mockFanoutHadSuccess.mockReturnValue(false)
      mockFanoutAll.mockResolvedValue([[{ platform: "X", success: false, error: "fail" }]])

      const { res, status } = makeMockRes()
      await postUraStock(req, res)

      expect(status).toHaveBeenCalledWith(502)
    })
  })
})
