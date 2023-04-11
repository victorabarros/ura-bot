import config from "../../src/config"

describe("Test config", () => {

  describe("finnhub", () => {
    it("success", async () => {
      const { address, apiKey } = config.finnhub
    })
  })

  describe("twitter", () => {
    it("success", async () => {
      const { apiKey, apiKeySecret, accessToken, accessTokenSecret } = config.twitter.uraBot
    })
  })

  describe("index", () => {
    it("success", async () => {
      const { port, apiKey } = config
    })
  })

  describe("router", () => {
    it("success", async () => {
      const { version } = config
    })
  })
})
