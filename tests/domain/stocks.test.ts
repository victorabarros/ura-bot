import {
  formatQuoteLine,
  buildSignature,
  buildStockMessages,
  buildHolidayMessage,
  PostContext,
} from "../../src/domain/stocks"
import { Quote } from "../../src/services/finnhub"

function makeQuote(symbol: string, price: number, openPrice: number): Quote {
  return { symbol, price, openPrice, highPrice: price, lowPrice: price, previousClosePrice: openPrice }
}

const noContext: PostContext = { isMorning: false, isEvening: false, isFriday: false }
const morningCtx: PostContext = { isMorning: true, isEvening: false, isFriday: false }
const eveningCtx: PostContext = { isMorning: false, isEvening: true, isFriday: false }
const eveningFridayCtx: PostContext = { isMorning: false, isEvening: true, isFriday: true }

describe("formatQuoteLine", () => {
  it("formats a positive delta with up arrow", () => {
    const line = formatQuoteLine(makeQuote("CCJ", 55.0, 50.0))
    expect(line).toContain("CCJ")
    expect(line).toContain("55.00")
    expect(line).toContain("+10.00%")
    expect(line).toContain("📈")
  })

  it("formats a negative delta with down arrow", () => {
    const line = formatQuoteLine(makeQuote("UEC", 45.0, 50.0))
    expect(line).toContain("UEC")
    expect(line).toContain("45.00")
    expect(line).toContain("-10.00%")
    expect(line).toContain("📉")
  })

  it("treats zero openPrice as no change", () => {
    const line = formatQuoteLine(makeQuote("URA", 10.0, 0))
    expect(line).toContain("+0.00%")
    expect(line).toContain("📈")
  })

  it("pads the ticker to 7 characters", () => {
    const line = formatQuoteLine(makeQuote("CCJ", 10, 10))
    expect(line.startsWith("CCJ    ")).toBe(true)
  })
})

describe("buildSignature", () => {
  it("contains the market timezone label", () => {
    const sig = buildSignature(new Date("2024-06-07T14:00:00Z"))
    expect(sig).toContain("America/New_York")
  })

  it("contains the uranium hashtag", () => {
    const sig = buildSignature(new Date("2024-06-07T14:00:00Z"))
    expect(sig).toContain("#Uranium")
  })

  it("includes a time in HH:MM format", () => {
    const sig = buildSignature(new Date("2024-06-07T14:00:00Z"))
    expect(sig).toMatch(/\d{2}:\d{2}/)
  })
})

describe("buildStockMessages", () => {
  const quotes = Array.from({ length: 8 }, (_, i) =>
    makeQuote(`T${i}`, 10 + i, 10)
  )
  const now = new Date("2024-06-07T14:00:00Z")

  it("produces one message when quotes fit in a single chunk", () => {
    const msgs = buildStockMessages(quotes.slice(0, 3), now, noContext)
    expect(msgs).toHaveLength(1)
  })

  it("chunks into multiple messages when quotes exceed MAX (6)", () => {
    const msgs = buildStockMessages(quotes, now, noContext)
    expect(msgs.length).toBeGreaterThan(1)
  })

  it("prepends morning greeting on first chunk only", () => {
    const msgs = buildStockMessages(quotes, now, morningCtx)
    expect(msgs[0]).toContain("Good Morning")
    expect(msgs[1]).not.toContain("Good Morning")
  })

  it("appends evening sign-off on last chunk only", () => {
    const msgs = buildStockMessages(quotes, now, eveningCtx)
    const last = msgs[msgs.length - 1]
    expect(last).toContain("Good Night")
    expect(msgs[0]).not.toContain("Good Night")
  })

  it("includes Friday weekend text in evening sign-off", () => {
    const msgs = buildStockMessages(quotes.slice(0, 3), now, eveningFridayCtx)
    expect(msgs[0]).toContain("Have a nice and sunny weekend")
  })

  it("does not include weekend text on non-Friday evening", () => {
    const msgs = buildStockMessages(quotes.slice(0, 3), now, eveningCtx)
    expect(msgs[0]).not.toContain("Have a nice and sunny weekend")
  })

  it("contains each ticker line in its chunk", () => {
    const msgs = buildStockMessages(quotes.slice(0, 2), now, noContext)
    expect(msgs[0]).toContain("T0")
    expect(msgs[0]).toContain("T1")
  })
})

describe("buildHolidayMessage", () => {
  const now = new Date("2024-07-04T14:00:00Z")

  it("uses the custom message when provided", () => {
    const msg = buildHolidayMessage("Independence Day", "Happy 4th!", now, noContext)
    expect(msg).toContain("Happy 4th!")
    expect(msg).not.toContain("Today is Independence Day")
  })

  it("falls back to 'Today is <name>' when no custom message", () => {
    const msg = buildHolidayMessage("Independence Day", undefined, now, noContext)
    expect(msg).toContain("Today is Independence Day")
  })

  it("prepends morning greeting in morning context", () => {
    const msg = buildHolidayMessage("Memorial Day", undefined, now, morningCtx)
    expect(msg).toContain("Good Morning")
  })

  it("does not prepend morning greeting outside morning context", () => {
    const msg = buildHolidayMessage("Memorial Day", undefined, now, noContext)
    expect(msg).not.toContain("Good Morning")
  })

  it("always includes the signature", () => {
    const msg = buildHolidayMessage("Test Day", undefined, now, noContext)
    expect(msg).toContain("#Uranium")
    expect(msg).toContain("America/New_York")
  })
})

