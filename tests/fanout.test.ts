import {
  buildPostApiResponse,
  fanout,
  fanoutAll,
  FanoutResult,
} from "../src/domain/fanout"
import { ISocialService } from "../src/services/ISocialService"

// ── buildPostApiResponse ──────────────────────────────────────────────────────

describe("buildPostApiResponse", () => {
  const now = new Date("2024-01-01T12:00:00Z")

  it("returns only created_at when no X ids are present", () => {
    const results: FanoutResult[] = [
      { platform: "Nostr", success: true, id: "nostr-1" },
    ]
    const resp = buildPostApiResponse(now, results)
    expect(resp.created_at).toBe(now)
    expect(resp.tweet_id).toBeUndefined()
    expect(resp.tweet_ids).toBeUndefined()
  })

  it("returns tweet_id (singular) when exactly one X post succeeded", () => {
    const results: FanoutResult[] = [
      { platform: "X", success: true, id: "tweet-99" },
    ]
    const resp = buildPostApiResponse(now, results)
    expect(resp.tweet_id).toBe("tweet-99")
    expect(resp.tweet_ids).toBeUndefined()
  })

  it("returns tweet_ids (plural) when multiple X posts succeeded (chunked)", () => {
    const results: FanoutResult[] = [
      { platform: "X", success: true, id: "t1" },
      { platform: "X", success: true, id: "t2" },
    ]
    const resp = buildPostApiResponse(now, results)
    expect(resp.tweet_ids).toEqual(["t1", "t2"])
    expect(resp.tweet_id).toBeUndefined()
  })

  it("excludes failed X posts from tweet_ids", () => {
    const results: FanoutResult[] = [
      { platform: "X", success: true, id: "t1" },
      { platform: "X", success: false, error: "fail" },
    ]
    const resp = buildPostApiResponse(now, results)
    expect(resp.tweet_id).toBe("t1")
    expect(resp.tweet_ids).toBeUndefined()
  })
})

// ── fanout ────────────────────────────────────────────────────────────────────

describe("fanout", () => {
  function makeService(result: "success" | "failure" | Error): ISocialService {
    return {
      postMessage: jest.fn().mockImplementation(() => {
        if (result === "success") return Promise.resolve({ id: "mock-id" })
        if (result === "failure") return Promise.reject(new Error("post failed"))
        return Promise.reject(result)
      }),
    }
  }

  it("returns success result when service resolves", async () => {
    const targets = [{ name: "X", service: makeService("success") }]
    const results = await fanout("hello", targets)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ platform: "X", success: true, id: "mock-id" })
  })

  it("returns failure result without throwing when service rejects", async () => {
    const targets = [{ name: "X", service: makeService("failure") }]
    const results = await fanout("hello", targets)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ platform: "X", success: false })
    expect(results[0].error).toContain("post failed")
  })

  it("handles multiple targets independently", async () => {
    const targets = [
      { name: "X", service: makeService("success") },
      { name: "Nostr", service: makeService("failure") },
    ]
    const results = await fanout("hello", targets)
    expect(results).toHaveLength(2)
    expect(results.find((r) => r.platform === "X")?.success).toBe(true)
    expect(results.find((r) => r.platform === "Nostr")?.success).toBe(false)
  })

  it("appends err.data detail to error string when present", async () => {
    const errWithData = Object.assign(new Error("api error"), {
      data: { code: 403, message: "Forbidden" },
    })
    const targets = [{ name: "X", service: makeService(errWithData) }]
    const results = await fanout("msg", targets)
    expect(results[0].error).toContain("403")
  })

  it("calls postWithImage when imageUrl is provided and service supports it", async () => {
    const postWithImage = jest.fn().mockResolvedValue({ id: "img-id" })
    const service: ISocialService = {
      postMessage: jest.fn(),
      postWithImage,
    }
    const results = await fanout("hello", [{ name: "X", service }], "https://example.com/img.jpg")
    expect(postWithImage).toHaveBeenCalledWith("hello", "https://example.com/img.jpg")
    expect((service.postMessage as jest.Mock)).not.toHaveBeenCalled()
    expect(results[0]).toMatchObject({ platform: "X", success: true, id: "img-id" })
  })

  it("falls back to postMessage when imageUrl is provided but service lacks postWithImage", async () => {
    const postMessage = jest.fn().mockResolvedValue({ id: "text-id" })
    const service: ISocialService = { postMessage }
    const results = await fanout("hello", [{ name: "Nostr", service }], "https://example.com/img.jpg")
    expect(postMessage).toHaveBeenCalledWith("hello")
    expect(results[0]).toMatchObject({ platform: "Nostr", success: true, id: "text-id" })
  })
})

// ── fanoutAll ─────────────────────────────────────────────────────────────────

describe("fanoutAll", () => {
  it("posts messages in parallel and returns flat results", async () => {
    const calls: string[] = []
    const service: ISocialService = {
      postMessage: jest.fn().mockImplementation((msg: string) => {
        calls.push(msg)
        return Promise.resolve({ id: `id-${msg}` })
      }),
    }
    const targets = [{ name: "X", service }]
    const messages = ["msg1", "msg2", "msg3"]

    const results = await fanoutAll(messages, targets)

    expect(results).toHaveLength(3)
    expect(calls.sort()).toEqual(["msg1", "msg2", "msg3"])
    expect(results.find((r) => r.id === "id-msg1")).toMatchObject({ platform: "X", success: true })
    expect(results.find((r) => r.id === "id-msg3")).toMatchObject({ platform: "X", success: true })
  })

  it("returns empty array for empty messages list", async () => {
    const service: ISocialService = { postMessage: jest.fn() }
    const results = await fanoutAll([], [{ name: "X", service }])
    expect(results).toEqual([])
  })
})
