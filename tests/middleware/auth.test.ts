import { Request, Response, NextFunction } from "express"
import { authMiddleware } from "../../src/middleware/auth"

// config.ts is loaded by auth.ts; env vars are set in tests/setup.ts
// The API key configured there is "test-api-key"
const VALID_KEY = "test-api-key"

function makeReq(path: string, authorization?: string): Request {
  return {
    method: "POST",
    path,
    headers: { authorization },
  } as unknown as Request
}

function makeMockRes() {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

describe("authMiddleware", () => {
  let next: jest.MockedFunction<NextFunction>

  beforeEach(() => {
    next = jest.fn()
  })

  describe("unauthenticated paths", () => {
    it("calls next() for /heartbeat without checking the key", () => {
      const { res, status } = makeMockRes()
      authMiddleware(makeReq("/heartbeat"), res, next)
      expect(next).toHaveBeenCalled()
      expect(status).not.toHaveBeenCalled()
    })

    it("calls next() for /healthcheck without checking the key", () => {
      const { res, status } = makeMockRes()
      authMiddleware(makeReq("/healthcheck"), res, next)
      expect(next).toHaveBeenCalled()
      expect(status).not.toHaveBeenCalled()
    })
  })

  describe("authenticated paths", () => {
    it("calls next() when the Authorization header matches the API key", () => {
      const { res, status } = makeMockRes()
      authMiddleware(makeReq("/urabot/stocks", VALID_KEY), res, next)
      expect(next).toHaveBeenCalled()
      expect(status).not.toHaveBeenCalled()
    })

    it("responds 401 when the Authorization header is wrong", () => {
      const { res, status, json } = makeMockRes()
      authMiddleware(makeReq("/urabot/stocks", "wrong-key"), res, next)
      expect(next).not.toHaveBeenCalled()
      expect(status).toHaveBeenCalledWith(401)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("API key") })
      )
    })

    it("responds 401 when the Authorization header is missing", () => {
      const { res, status, json } = makeMockRes()
      authMiddleware(makeReq("/urabot/news"), res, next)
      expect(next).not.toHaveBeenCalled()
      expect(status).toHaveBeenCalledWith(401)
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      )
    })
  })
})
