/**
 * config.ts throws at module load time when env vars are missing.
 * Each test must use jest.resetModules() and re-require config to isolate load state.
 */

const REQUIRED_VARS = [
  "API_KEY",
  "FINNHUB_API_KEY",
  "URA_BOT_X_CONSUMER_KEY",
  "URA_BOT_X_CONSUMER_KEY_SECRET",
  "URA_BOT_X_ACCESS_TOKEN",
  "URA_BOT_X_ACCESS_TOKEN_SECRET",
  "REPLICATE_API_TOKEN",
]

function setAllVars() {
  process.env.API_KEY = "k-api"
  process.env.FINNHUB_API_KEY = "k-finnhub"
  process.env.URA_BOT_X_CONSUMER_KEY = "k-x-ck"
  process.env.URA_BOT_X_CONSUMER_KEY_SECRET = "k-x-cks"
  process.env.URA_BOT_X_ACCESS_TOKEN = "k-x-at"
  process.env.URA_BOT_X_ACCESS_TOKEN_SECRET = "k-x-ats"
  process.env.REPLICATE_API_TOKEN = "k-replicate"
}

afterEach(() => {
  // Restore all vars so other test files are not affected
  setAllVars()
  jest.resetModules()
})

describe("config", () => {
  it("loads successfully when all required env vars are set", () => {
    setAllVars()
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require("../src/config").default
    expect(cfg.apiKey).toBe("k-api")
    expect(cfg.finnhub.apiKey).toBe("k-finnhub")
    expect(cfg.x.consumerKey).toBe("k-x-ck")
    expect(cfg.replicate.apiKey).toBe("k-replicate")
  })

  it("uses PORT env var when set", () => {
    setAllVars()
    process.env.PORT = "9090"
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cfg = require("../src/config").default
    expect(cfg.port).toBe("9090")
    delete process.env.PORT
  })

  it.each(REQUIRED_VARS)(
    "throws when %s is missing",
    (varName) => {
      setAllVars()
      delete process.env[varName]
      jest.resetModules()
      expect(() => require("../src/config")).toThrow(
        `Missing required environment variable: ${varName}`
      )
    }
  )
})
