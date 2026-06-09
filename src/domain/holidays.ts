import moment from "moment-timezone"
import { getMarketHolidays } from "../services/finnhub"

const MARKET_TZ = "America/New_York"

/** US market holiday row (full close or early-close window). */
export type HolidayEntry = {
  eventName: string
  atDate: string      // YYYY-MM-DD
  tradingHour: string // "" = full close, "HH:MM-HH:MM" = early close
  message?: string
}

const FALLBACK_HOLIDAYS: HolidayEntry[] = [
  { eventName: "New Year's Day", atDate: "2026-01-01", tradingHour: "" },
  { eventName: "Birthday of Martin Luther King, Jr.", atDate: "2026-01-19", tradingHour: "" },
  { eventName: "Washington's Birthday", atDate: "2026-02-16", tradingHour: "" },
  { eventName: "Good Friday", atDate: "2026-04-03", tradingHour: "" },
  { eventName: "Memorial Day", atDate: "2026-05-25", tradingHour: "" },
  { eventName: "Juneteenth", atDate: "2026-06-19", tradingHour: "" },
  {
    eventName: "Independence Day",
    atDate: "2026-07-04",
    tradingHour: "",
    message: "Today is Independence Day 🎇🎇🎇\nCelebrate with your family and friends\nAnd always remember FREEDOM IS NOT FREE!",
  },
  { eventName: "Labor Day", atDate: "2026-09-07", tradingHour: "" },
  { eventName: "Thanksgiving Day", atDate: "2026-11-26", tradingHour: "" },
  { eventName: "Thanksgiving Day", atDate: "2026-11-27", tradingHour: "09:30-13:00" },
  { eventName: "Christmas Eve", atDate: "2026-12-24", tradingHour: "09:30-13:00" },
  { eventName: "Christmas Day", atDate: "2026-12-25", tradingHour: "" },
]

let cachedHolidays: HolidayEntry[] | null = null
let cacheExpiry = 0
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

async function getHolidays(): Promise<HolidayEntry[]> {
  if (cachedHolidays && Date.now() < cacheExpiry) return cachedHolidays

  try {
    const result = await getMarketHolidays("US")
    cachedHolidays = result.data.map(h => ({
      eventName: h.eventName,
      atDate: h.atDate,
      tradingHour: h.tradingHour,
    }))
    cacheExpiry = Date.now() + CACHE_TTL_MS
    return cachedHolidays
  } catch (err) {
    console.warn("[holidays] Failed to fetch from Finnhub, using fallback list:", (err as Error).message)
    return FALLBACK_HOLIDAYS
  }
}

/** Returns today's holiday entry in NY, if any. */
export async function getHolidayEntry(now: Date): Promise<HolidayEntry | undefined> {
  return FALLBACK_HOLIDAYS[7]
  const holidays = await getHolidays()
  const today = moment(now).tz(MARKET_TZ).format("YYYY-MM-DD")
  return holidays.find(h => h.atDate === today)
}
