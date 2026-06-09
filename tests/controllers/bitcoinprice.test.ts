import { Request, Response } from "express"
import { postBitcoinPrice } from "../../src/controllers/bitcoinprice"

jest.mock("../../src/services/coingecko", () => ({
  getBitcoinMarketData: jest.fn(),
}))
jest.mock("../../src/services/bitview", () => ({
  getBitcoinOnchainData: jest.fn(),
}))
jest.mock("../../src/services/feargreed", () => ({
  getFearGreedIndex: jest.fn(),
}))
jest.mock("../../src/services/x", () => ({
  uraBotXService: { postMessage: jest.fn(), checkHealth: jest.fn() },
  bitcoinmetrxXService: { postMessage: jest.fn(), checkHealth: jest.fn() },
}))

import { getBitcoinMarketData } from "../../src/services/coingecko"
import { getBitcoinOnchainData } from "../../src/services/bitview"
import { getFearGreedIndex } from "../../src/services/feargreed"
import { bitcoinmetrxXService } from "../../src/services/x"

const mockGetMarket = getBitcoinMarketData as jest.MockedFunction<typeof getBitcoinMarketData>
const mockGetOnchain = getBitcoinOnchainData as jest.MockedFunction<typeof getBitcoinOnchainData>
const mockGetFearGreed = getFearGreedIndex as jest.MockedFunction<typeof getFearGreedIndex>
const mockPostMessage = bitcoinmetrxXService.postMessage as jest.MockedFunction<typeof bitcoinmetrxXService.postMessage>

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

const mockReq = {} as Request

const defaultMarket = {
  priceUsd: 105432,
  change24hPct: 2.31,
  marketCapUsd: 2_090_000_000_000,
  volume24hUsd: 48_000_000_000,
}

const defaultOnchain = { mvrv: 2.41, realizedPriceUsd: 53_549 }
const defaultFearGreed = { value: 72, classification: "Greed" }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetMarket.mockResolvedValue(defaultMarket)
  mockGetOnchain.mockResolvedValue(defaultOnchain)
  mockGetFearGreed.mockResolvedValue(defaultFearGreed)
  mockPostMessage.mockResolvedValue({ id: "tweet-123" })
})

describe("postBitcoinPrice", () => {
  it("returns 200 with tweet_id on full success", async () => {
    const { res, status, json } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ tweet_id: "tweet-123" })
    )
  })

  it("calls all three data services", async () => {
    const { res } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(mockGetMarket).toHaveBeenCalledTimes(1)
    expect(mockGetOnchain).toHaveBeenCalledTimes(1)
    expect(mockGetFearGreed).toHaveBeenCalledTimes(1)
  })

  it("posts message containing price, MVRV, fear&greed, and hashtags", async () => {
    const { res } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    const message: string = mockPostMessage.mock.calls[0][0]
    expect(message).toContain("$105,432")
    expect(message).toContain("MVRV: 2.41")
    expect(message).toContain("Realized Price: $53,549")
    expect(message).toContain("Fear & Greed: 72/100 — Greed")
    expect(message).toContain("#Bitcoin #BTC")
  })

  it("returns 503 when price fetch fails", async () => {
    mockGetMarket.mockRejectedValue(new Error("CoinGecko down"))
    const { res, status, json } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(status).toHaveBeenCalledWith(503)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ integration: "coingecko" })
    )
    expect(mockPostMessage).not.toHaveBeenCalled()
  })

  it("still posts when on-chain data fetch fails", async () => {
    mockGetOnchain.mockRejectedValue(new Error("Bitview timeout"))
    const { res, status } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(status).toHaveBeenCalledWith(200)
    const message: string = mockPostMessage.mock.calls[0][0]
    expect(message).not.toContain("MVRV")
    expect(message).toContain("#Bitcoin #BTC")
  })

  it("still posts when fear & greed fetch fails", async () => {
    mockGetFearGreed.mockRejectedValue(new Error("alternative.me down"))
    const { res, status } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(status).toHaveBeenCalledWith(200)
    const message: string = mockPostMessage.mock.calls[0][0]
    expect(message).not.toContain("Fear & Greed")
    expect(message).toContain("#Bitcoin #BTC")
  })

  it("returns 503 when X postMessage fails", async () => {
    mockPostMessage.mockRejectedValue(new Error("X API error"))
    const { res, status, json } = makeMockRes()
    await postBitcoinPrice(mockReq, res)

    expect(status).toHaveBeenCalledWith(503)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ integration: "x" })
    )
  })
})
