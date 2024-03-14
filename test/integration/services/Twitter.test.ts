import { UraTwitterService } from "../../../src/services/Twitter"

describe("Test Services Twitter", () => {

  describe("write tweet", () => {
    it("success", async () => {
      const resp = await UraTwitterService.writeTweet("test")
      console.log("UraTwitterService.writeTweet", JSON.stringify(resp))
    })
  })

})
