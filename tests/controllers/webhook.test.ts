import crypto from "crypto"
import { Request, Response } from "express"
import { handleWebhookCrc, receiveWebhook } from "../../src/controllers/webhook"

const TEST_CONSUMER_SECRET = "test-x-consumer-key-secret" // matches tests/setup.ts

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const send = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json, send })
  return { res: { status, json, send } as unknown as Response, status, json, send }
}

const makeReq = (query: Record<string, string> = {}): Request =>
  ({ query } as unknown as Request)

describe("handleWebhookCrc", () => {
  it("returns 200 with correct response_token for a valid crc_token", () => {
    const crc_token = "challenge-abc-123"
    const expectedHash = crypto
      .createHmac("sha256", TEST_CONSUMER_SECRET)
      .update(crc_token)
      .digest("base64")

    const { res, status, json } = makeMockRes()
    handleWebhookCrc(makeReq({ crc_token }), res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ response_token: `sha256=${expectedHash}` })
  })

  it("returns 400 when crc_token is missing", () => {
    const { res, status, json } = makeMockRes()
    handleWebhookCrc(makeReq(), res)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith({ error: "Missing crc_token" })
  })
})

describe("receiveWebhook", () => {
  it("returns 200 with empty body for any POST payload", () => {
    const { res, status, send } = makeMockRes()
    receiveWebhook({} as Request, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(send).toHaveBeenCalled()
  })
})
