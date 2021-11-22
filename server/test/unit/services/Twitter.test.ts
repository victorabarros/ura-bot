/* eslint-disable @typescript-eslint/no-unused-vars */
import Twitter from "twitter-lite"
import TwitterService from "../../../src/services/Twitter"

// Twitter Mock
jest.mock("twitter-lite", () => ((params: unknown) => ({
  post: (path: string, data: unknown) => ({ id_str: "xpto" }),
  getBearerToken: () => "token",
})))

describe("Test Services Twitter", () => {

  describe("write twitter", () => {
    it("success", async () => {
      const { id } = await TwitterService.writeTweet("message")
      expect(Twitter).toHaveBeenCalled
      expect(id).toBe("xpto")
    })
  })

  describe("check", () => {
    it("success", async () => {
      const isHealth = await TwitterService.check()
      expect(isHealth).toBeTruthy()
    })
  })
})
