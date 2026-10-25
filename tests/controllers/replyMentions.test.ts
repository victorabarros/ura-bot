import { Request, Response } from "express"
import { replyToMentions } from "../../src/controllers/replyMentions"

jest.mock("../../src/services/x", () => ({
  uraBotXService: {
    getMentions: jest.fn(),
    replyToPost: jest.fn(),
  },
}))
jest.mock("../../src/services/replicate", () => ({
  generateMentionReply: jest.fn(),
  shouldReplyToMention: jest.fn(),
  generateImage: jest.fn(),
  checkReplicateHealth: jest.fn(),
}))

import { uraBotXService } from "../../src/services/x"
import { generateMentionReply, shouldReplyToMention } from "../../src/services/replicate"
import { TweetResult } from "../../src/services/x"

const mockGetMentions = uraBotXService.getMentions as jest.MockedFunction<typeof uraBotXService.getMentions>
const mockReplyToPost = uraBotXService.replyToPost as jest.MockedFunction<typeof uraBotXService.replyToPost>
const mockGenerateMentionReply = generateMentionReply as jest.MockedFunction<typeof generateMentionReply>

const makeMockRes = () => {
  const json = jest.fn().mockReturnThis()
  const send = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json, send })
  return { res: { status, json, send } as unknown as Response, status, json, send }
}

const makeMention = (id: string, text = "What do you think about uranium?"): TweetResult => ({
  id,
  text,
  authorId: "user-1",
  createdAt: new Date().toISOString(),
  likeCount: 0,
  retweetCount: 0,
  replySettings: "everyone",
})

const req = {} as Request

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(shouldReplyToMention).mockResolvedValue(true)
})

describe("replyToMentions", () => {
  it("returns 204 when no mentions in the last hour", async () => {
    mockGetMentions.mockResolvedValue([])

    const { res, status, send } = makeMockRes()
    await replyToMentions(req, res)

    expect(status).toHaveBeenCalledWith(204)
    expect(send).toHaveBeenCalled()
  })

  it("returns 503 when getMentions throws", async () => {
    mockGetMentions.mockRejectedValue(new Error("X API down"))

    const { res, status } = makeMockRes()
    await replyToMentions(req, res)

    expect(status).toHaveBeenCalledWith(503)
    expect(mockGenerateMentionReply).not.toHaveBeenCalled()
  })

  it("returns 200 with all replied when every mention succeeds", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1"), makeMention("m-2")])
    mockGenerateMentionReply.mockResolvedValue("Great question about uranium!")
    mockReplyToPost.mockResolvedValue({ id: "reply-1" })

    const { res, status, json } = makeMockRes()
    await replyToMentions(req, res)

    expect(status).toHaveBeenCalledWith(200)
    const body = json.mock.calls[0][0]
    expect(body.replied).toHaveLength(2)
    expect(body.failed).toHaveLength(0)
  })

  it("returns 200 with partial failed when Replicate fails for one mention", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1"), makeMention("m-2")])
    mockGenerateMentionReply
      .mockResolvedValueOnce("Solid question.")
      .mockRejectedValueOnce(new Error("model timeout"))
    mockReplyToPost.mockResolvedValue({ id: "reply-1" })

    const { res, status, json } = makeMockRes()
    await replyToMentions(req, res)

    expect(status).toHaveBeenCalledWith(200)
    const body = json.mock.calls[0][0]
    expect(body.replied).toHaveLength(1)
    expect(body.failed).toHaveLength(1)
    expect(body.failed[0].error).toMatch(/replicate/)
  })

  it("returns 200 with partial failed when replyToPost fails for one mention", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1"), makeMention("m-2")])
    mockGenerateMentionReply.mockResolvedValue("Good point.")
    mockReplyToPost
      .mockResolvedValueOnce({ id: "reply-1" })
      .mockRejectedValueOnce(new Error("rate limited"))

    const { res, status, json } = makeMockRes()
    await replyToMentions(req, res)

    expect(status).toHaveBeenCalledWith(200)
    const body = json.mock.calls[0][0]
    expect(body.replied).toHaveLength(1)
    expect(body.failed).toHaveLength(1)
    expect(body.failed[0].error).toMatch(/x:/)
  })
})

describe("reply selection", () => {
  it("skips low-value mentions without generating or posting", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1", "thanks!")])
    jest.mocked(shouldReplyToMention).mockResolvedValue(false)
    const { res, json } = makeMockRes()
    await replyToMentions(req, res)
    expect(mockGenerateMentionReply).not.toHaveBeenCalled()
    expect(mockReplyToPost).not.toHaveBeenCalled()
    expect(json).toHaveBeenCalledWith({ replied: [], failed: [], skipped: [{ mention_id: "m-1", reason: "not_worth_replying" }] })
  })

  it("posts only selected mentions in a mixed batch", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1", "nice!"), makeMention("m-2", "Why long contracts?")])
    jest.mocked(shouldReplyToMention).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    mockGenerateMentionReply.mockResolvedValue("Utilities need fuel supply they can plan around.")
    mockReplyToPost.mockResolvedValue({ id: "r-2" })
    const { res, json } = makeMockRes()
    await replyToMentions(req, res)
    expect(mockGenerateMentionReply).toHaveBeenCalledTimes(1)
    expect(mockGenerateMentionReply).toHaveBeenCalledWith("Why long contracts?")
    expect(mockReplyToPost).toHaveBeenCalledTimes(1)
    expect(mockReplyToPost).toHaveBeenCalledWith("Utilities need fuel supply they can plan around.", "m-2")
    expect(json.mock.calls[0][0].skipped).toHaveLength(1)
    expect(json.mock.calls[0][0].replied).toHaveLength(1)
  })

  it("does not post when selection fails, but still processes other mentions", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1"), makeMention("m-2")])
    jest.mocked(shouldReplyToMention).mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(true)
    mockGenerateMentionReply.mockResolvedValue("Utilities typically contract years ahead.")
    mockReplyToPost.mockResolvedValue({ id: "r-2" })
    const { res, json } = makeMockRes()
    await replyToMentions(req, res)
    expect(mockReplyToPost).toHaveBeenCalledTimes(1)
    expect(mockReplyToPost).toHaveBeenCalledWith("Utilities typically contract years ahead.", "m-2")
    expect(json.mock.calls[0][0].failed).toHaveLength(1)
  })

  it("skips generation that produces no valid reply", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1")])
    mockGenerateMentionReply.mockResolvedValue(null)
    const { res, json } = makeMockRes()
    await replyToMentions(req, res)
    expect(mockReplyToPost).not.toHaveBeenCalled()
    expect(json.mock.calls[0][0].skipped[0].reason).toBe("no_valid_reply")
  })
})
