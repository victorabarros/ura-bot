import { uraTwitter } from "../../../src/services"

describe("Test Services Twitter", () => {

  describe("write tweet", () => {
    it.skip("success", async () => {
      // Use to test the post message to Urabot account
      const resp = await uraTwitter.postMessage("test")
      console.log("uraTwitter.postMessage", JSON.stringify(resp))
    })
  })

})
