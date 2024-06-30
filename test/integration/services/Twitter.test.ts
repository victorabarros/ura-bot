import { UraTwitterService } from "../../../src/services/Twitter"

describe("Test Services Twitter", () => {

  describe("write tweet", () => {
    it.skip("success", async () => {
      const resp = await UraTwitterService.postMessage("test")
      console.log("UraTwitterService.postMessage", JSON.stringify(resp))
    })
  })

})
