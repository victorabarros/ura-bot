import { getPostContext } from "../../src/domain/context"

describe("getPostContext", () => {
  function makeUTCDate(hour: number, minute: number, dayOfWeek: number): Date {
    // dayOfWeek: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    // Use a known reference Monday (2024-01-01 was a Monday)
    const base = new Date("2024-01-01T00:00:00Z")
    // Adjust to the desired day of week: base is Monday (day 1)
    const dayOffset = (dayOfWeek - 1 + 7) % 7
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + dayOffset)
    d.setUTCHours(hour, minute, 0, 0)
    return d
  }

  describe("isMorning", () => {
    it("is true at UTC 14:00", () => {
      const ctx = getPostContext(makeUTCDate(14, 0, 1))
      expect(ctx.isMorning).toBe(true)
    })

    it("is true at UTC 14:04 (within 5-min window)", () => {
      const ctx = getPostContext(makeUTCDate(14, 4, 1))
      expect(ctx.isMorning).toBe(true)
    })

    it("is false at UTC 14:05 (outside window)", () => {
      const ctx = getPostContext(makeUTCDate(14, 5, 1))
      expect(ctx.isMorning).toBe(false)
    })

    it("is false at UTC 13:59", () => {
      const ctx = getPostContext(makeUTCDate(13, 59, 1))
      expect(ctx.isMorning).toBe(false)
    })
  })

  describe("isEvening", () => {
    it("is true at UTC 21:00", () => {
      const ctx = getPostContext(makeUTCDate(21, 0, 1))
      expect(ctx.isEvening).toBe(true)
    })

    it("is true at UTC 21:04 (within 5-min window)", () => {
      const ctx = getPostContext(makeUTCDate(21, 4, 1))
      expect(ctx.isEvening).toBe(true)
    })

    it("is false at UTC 21:05 (outside window)", () => {
      const ctx = getPostContext(makeUTCDate(21, 5, 1))
      expect(ctx.isEvening).toBe(false)
    })

    it("is false at UTC 20:59", () => {
      const ctx = getPostContext(makeUTCDate(20, 59, 1))
      expect(ctx.isEvening).toBe(false)
    })
  })

  describe("isFriday", () => {
    it("is true when the NY date is Friday", () => {
      // Friday 2024-01-05 at 14:00 UTC = 09:00 ET (still Friday in NY)
      const friday = new Date("2024-01-05T14:00:00Z")
      const ctx = getPostContext(friday)
      expect(ctx.isFriday).toBe(true)
    })

    it("is false when the NY date is Monday", () => {
      const monday = new Date("2024-01-01T14:00:00Z")
      const ctx = getPostContext(monday)
      expect(ctx.isFriday).toBe(false)
    })

    it("is false when the NY date is Saturday", () => {
      const saturday = new Date("2024-01-06T14:00:00Z")
      const ctx = getPostContext(saturday)
      expect(ctx.isFriday).toBe(false)
    })
  })

  describe("all flags false outside any window", () => {
    it("returns all false at noon UTC on a Wednesday", () => {
      const wednesday = new Date("2024-01-03T12:00:00Z")
      const ctx = getPostContext(wednesday)
      expect(ctx.isMorning).toBe(false)
      expect(ctx.isEvening).toBe(false)
      expect(ctx.isFriday).toBe(false)
    })
  })
})
