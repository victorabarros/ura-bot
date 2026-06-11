import { Request, Response } from "express"
import { replyToMentions } from "../../src/controllers/replyMentions"

jest.mock("../../src/services/x", () => ({
  uraBotXService: {
    getMentions: jest.fn(),
    replyToPost: jest.fn(),
  },
}))
jest.mock("../../src/services/replicate", () => ({
  generateComment: jest.fn(),
  generateImage: jest.fn(),
  checkReplicateHealth: jest.fn(),
}))

import { uraBotXService } from "../../src/services/x"
import { generateComment } from "../../src/services/replicate"
import { TweetResult } from "../../src/services/x"

const mockGetMentions = uraBotXService.getMentions as jest.MockedFunction<typeof uraBotXService.getMentions>
const mockReplyToPost = uraBotXService.replyToPost as jest.MockedFunction<typeof uraBotXService.replyToPost>
const mockGenerateComment = generateComment as jest.MockedFunction<typeof generateComment>

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

beforeEach(() => jest.clearAllMocks())

describe("replyToMentions", () => {
  it("returns 204 when no mentions in the last 5 minutes", async () => {
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
    expect(mockGenerateComment).not.toHaveBeenCalled()
  })

  it("returns 200 with all replied when every mention succeeds", async () => {
    mockGetMentions.mockResolvedValue([makeMention("m-1"), makeMention("m-2")])
    mockGenerateComment.mockResolvedValue("Great question about uranium!")
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
    mockGenerateComment
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
    mockGenerateComment.mockResolvedValue("Good point.")
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
