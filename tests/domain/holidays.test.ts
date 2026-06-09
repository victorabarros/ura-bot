/**
 * The holidays module has module-level cache state (cachedHolidays, cacheExpiry).
 * To prevent cross-test contamination each test uses jest.isolateModules to load
 * a fresh module instance with an empty cache.
 */

type IsHolidayFn = (now: Date) => Promise<boolean>
type GetHolidayEntryFn = (now: Date) => Promise<{ eventName: string; atDate: string; tradingHour: string; message?: string } | undefined>

function finnhubResponse(entries: { atDate: string; tradingHour: string; eventName: string }[]) {
  return { data: entries, exchange: "US", timezone: "America/New_York" }
}

function loadFreshModule(getMarketHolidaysMock: jest.Mock): { isHoliday: IsHolidayFn; getHolidayEntry: GetHolidayEntryFn } {
  let holidays: { isHoliday: IsHolidayFn; getHolidayEntry: GetHolidayEntryFn } | undefined

  jest.isolateModules(() => {
    jest.mock("../../src/services/finnhub", () => ({
      getMarketHolidays: getMarketHolidaysMock,
    }))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    holidays = require("../../src/domain/holidays")
  })

  return holidays!
}

describe("isHoliday", () => {
  it("returns true for a full-close holiday (tradingHour empty)", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-07-04", tradingHour: "", eventName: "Independence Day" }])
    )
    const { isHoliday } = loadFreshModule(mock)
    const result = await isHoliday(new Date("2026-07-04T14:00:00Z"))
    expect(result).toBe(true)
  })

  it("returns false for a non-holiday date", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-07-04", tradingHour: "", eventName: "Independence Day" }])
    )
    const { isHoliday } = loadFreshModule(mock)
    const result = await isHoliday(new Date("2026-07-03T14:00:00Z"))
    expect(result).toBe(false)
  })

  it("returns true during an early-close window", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-12-24", tradingHour: "09:30-13:00", eventName: "Christmas Eve" }])
    )
    const { isHoliday } = loadFreshModule(mock)
    // 2026-12-24T16:00:00Z = 11:00 ET — inside 09:30-13:00 window
    const result = await isHoliday(new Date("2026-12-24T16:00:00Z"))
    expect(result).toBe(true)
  })

  it("returns false outside an early-close window (before open)", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-12-24", tradingHour: "09:30-13:00", eventName: "Christmas Eve" }])
    )
    const { isHoliday } = loadFreshModule(mock)
    // 2026-12-24T13:00:00Z = 08:00 ET — before 09:30
    const result = await isHoliday(new Date("2026-12-24T13:00:00Z"))
    expect(result).toBe(false)
  })

  it("returns false outside an early-close window (after close)", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-12-24", tradingHour: "09:30-13:00", eventName: "Christmas Eve" }])
    )
    const { isHoliday } = loadFreshModule(mock)
    // 2026-12-24T19:00:00Z = 14:00 ET — after 13:00
    const result = await isHoliday(new Date("2026-12-24T19:00:00Z"))
    expect(result).toBe(false)
  })

  it("falls back to static list when Finnhub rejects", async () => {
    const mock = jest.fn().mockRejectedValueOnce(new Error("network error"))
    const { isHoliday } = loadFreshModule(mock)
    // 2026-07-04 is in the static fallback list as a full holiday
    const result = await isHoliday(new Date("2026-07-04T14:00:00Z"))
    expect(result).toBe(true)
  })
})

describe("getHolidayEntry", () => {
  it("returns the entry for a matching date", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-09-07", tradingHour: "", eventName: "Labor Day" }])
    )
    const { getHolidayEntry } = loadFreshModule(mock)
    const entry = await getHolidayEntry(new Date("2026-09-07T14:00:00Z"))
    expect(entry).toBeDefined()
    expect(entry!.eventName).toBe("Labor Day")
    expect(entry!.atDate).toBe("2026-09-07")
  })

  it("returns undefined for a non-matching date", async () => {
    const mock = jest.fn().mockResolvedValueOnce(
      finnhubResponse([{ atDate: "2026-09-07", tradingHour: "", eventName: "Labor Day" }])
    )
    const { getHolidayEntry } = loadFreshModule(mock)
    const entry = await getHolidayEntry(new Date("2026-09-08T14:00:00Z"))
    expect(entry).toBeUndefined()
  })

  it("returns an entry from the fallback list when Finnhub fails", async () => {
    const mock = jest.fn().mockRejectedValueOnce(new Error("timeout"))
    const { getHolidayEntry } = loadFreshModule(mock)
    // Christmas Day is in the 2026 fallback list
    const entry = await getHolidayEntry(new Date("2026-12-25T14:00:00Z"))
    expect(entry).toBeDefined()
    expect(entry!.eventName).toBe("Christmas Day")
  })
})
