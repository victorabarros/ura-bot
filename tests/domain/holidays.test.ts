/**
 * The holidays module has module-level cache state (cachedHolidays, cacheExpiry).
 * To prevent cross-test contamination each test uses jest.isolateModules to load
 * a fresh module instance with an empty cache.
 */

type GetHolidayEntryFn = (now: Date) => Promise<{ eventName: string; atDate: string; tradingHour: string; message?: string } | undefined>

function finnhubResponse(entries: { atDate: string; tradingHour: string; eventName: string }[]) {
  return { data: entries, exchange: "US", timezone: "America/New_York" }
}

function loadFreshModule(getMarketHolidaysMock: jest.Mock): { getHolidayEntry: GetHolidayEntryFn } {
  let holidays: { getHolidayEntry: GetHolidayEntryFn } | undefined

  jest.isolateModules(() => {
    jest.mock("../../src/services/finnhub", () => ({
      getMarketHolidays: getMarketHolidaysMock,
    }))
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    holidays = require("../../src/domain/holidays")
  })

  return holidays!
}

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
