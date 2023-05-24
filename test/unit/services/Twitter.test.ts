/* eslint-disable @typescript-eslint/no-unused-vars */
import Twitter from "twitter-lite"
import { UraTwitterService } from "../../../src/services/Twitter"

// Twitter Mock
jest.mock("twitter-lite",
  () => jest.fn().mockImplementation(() => (
    {
      post: (path: string, data: unknown) => ({ id_str: "xpto" }),
      getBearerToken: () => "token",
    }
  ))
)

describe("Test Services Twitter", () => {

  describe("write twitter", () => {
    it("success", async () => {
      const { id } = await UraTwitterService.writeTweet("message")
      expect(Twitter).toHaveBeenCalled
      expect(id).toBe("xpto")
    })
  })

  describe("check", () => {
    it("success", async () => {
      await UraTwitterService.check()
      expect(true).toBeTruthy()
    })
  })
})
