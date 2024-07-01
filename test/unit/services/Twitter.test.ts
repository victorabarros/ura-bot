/* eslint-disable @typescript-eslint/no-unused-vars */
import { uraTwitter } from "../../../src/services"

describe("Test Services Twitter", () => {

  describe("check", () => {
    it("success", async () => {
      expect(await uraTwitter.check()).toBeTruthy()
    })
  })

})
