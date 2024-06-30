/* eslint-disable @typescript-eslint/no-unused-vars */
import { UraTwitterService } from "../../../src/services/Twitter"

describe("Test Services Twitter", () => {

  describe("write twitter", () => {
    it.skip("success", async () => {
      // Use to test the post message to Urabot account
      const { id } = await UraTwitterService.postMessage("message")
      expect(id).toBe("TODO")
    })
  })

  describe("check", () => {
    it("success", async () => {
      expect(await UraTwitterService.check()).toBeTruthy()
    })
  })
})
