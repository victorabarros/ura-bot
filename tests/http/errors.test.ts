import { Response } from "express"
import { respondSocialPublishFailed } from "../../src/http/errors"
import { FanoutResult } from "../../src/domain/fanout"

function makeMockResponse() {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

describe("respondSocialPublishFailed", () => {
  it("sends 502 with a fixed error body", () => {
    const { res, status, json } = makeMockResponse()
    const results: FanoutResult[] = [
      { platform: "X", success: false, error: "timeout" },
    ]
    respondSocialPublishFailed(res, results)
    expect(status).toHaveBeenCalledWith(502)
    expect(json).toHaveBeenCalledWith({
      error: "All social platforms failed to publish",
      integration: "social",
    })
  })

  it("includes all platform errors in the console log", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { /* suppress */ })
    const { res } = makeMockResponse()
    const results: FanoutResult[] = [
      { platform: "X", success: false, error: "network error" },
      { platform: "Nostr", success: false, error: "relay down" },
    ]
    respondSocialPublishFailed(res, results)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("network error")
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("relay down")
    )
    consoleSpy.mockRestore()
  })
})
