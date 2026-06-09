import moment from "moment-timezone"

const MARKET_TZ = "America/New_York"

// NYSE open ~09:30 ET = 14:30 UTC → first post window: 14:00–14:30 UTC
const MORNING_HOUR_UTC = 14
// NYSE close ~16:00 ET = 21:00 UTC → evening post window: 20:55–21:05 UTC
const EVENING_HOUR_UTC = 21
const WINDOW_MINUTES = 5

/** Time-of-day flags for stock post greetings and sign-offs. */
export type PostContext = {
  isMorning: boolean
  isEvening: boolean
  isFriday: boolean
}

/**
 * Derives morning/evening windows (UTC) and whether today is Friday in NY.
 * Uses a short minute window, not exact clock equality.
 */
export const getPostContext = (now: Date): PostContext => {
  const m = moment(now).utc()
  const hour = m.hour()
  const minute = m.minute()

  const isMorning = hour === MORNING_HOUR_UTC && minute < WINDOW_MINUTES
  const isEvening = hour === EVENING_HOUR_UTC && minute < WINDOW_MINUTES

  const dayInNY = moment(now).tz(MARKET_TZ).day()
  const isFriday = dayInNY === 5

  return { isMorning, isEvening, isFriday }
}
