/* eslint-disable @typescript-eslint/no-unused-vars */
import { UraTwitterService } from "../../../src/services/Twitter"

describe("Test Services Twitter", () => {

  describe("check", () => {
    it("success", async () => {
      expect(await UraTwitterService.check()).toBeTruthy()
    })
  })

})
