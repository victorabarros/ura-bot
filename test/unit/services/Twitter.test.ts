/* eslint-disable @typescript-eslint/no-unused-vars */
import { UraTwitterService } from "../../../src/services/Twitter"

describe("Test Services Twitter", () => {

  describe("write twitter", () => {
    it.skip("success", async () => {
      const { id } = await UraTwitterService.postMessage("message")
      expect(id).toBe("mock")
    })
  })

  describe.skip("check", () => {
    it("success", async () => {
      await UraTwitterService.check()
      expect(true).toBeTruthy()
    })
  })
})
