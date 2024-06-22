type HolidayDetails = {
  eventName: string
  atDate: string
  tradingHour: string
}

type GetHolidaysResponse = {
  data: Array<HolidayDetails>
  exchange: string
  timezone: string
}

export const MARKET_HOLIDAYS: GetHolidaysResponse = {
  data: [
    {
      eventName: "Christmas Day",
      atDate: "2026-12-25",
      tradingHour: "",
    },
    {
      eventName: "Christmas Day",
      atDate: "2026-12-24",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2026-11-27",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2026-11-26",
      tradingHour: "",
    },
    {
      eventName: "Labor Day",
      atDate: "2026-09-07",
      tradingHour: "",
    },
    {
      eventName: "Independence Day",
      atDate: "2026-07-03",
      tradingHour: "",
    },
    {
      eventName: "Juneteenth",
      atDate: "2026-06-19",
      tradingHour: "",
    },
    {
      eventName: "Memorial Day",
      atDate: "2026-05-25",
      tradingHour: "",
    },
    {
      eventName: "Good Friday",
      atDate: "2026-04-03",
      tradingHour: "",
    },
    {
      eventName: "Washington's Birthday",
      atDate: "2026-02-16",
      tradingHour: "",
    },
    {
      eventName: "Birthday of Martin Luther King, Jr",
      atDate: "2026-01-19",
      tradingHour: "",
    },
    {
      eventName: "New Year's Day",
      atDate: "2026-01-01",
      tradingHour: "",
    },
    {
      eventName: "Christmas Day",
      atDate: "2025-12-25",
      tradingHour: "",
    },
    {
      eventName: "Christmas Day",
      atDate: "2025-12-24",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2025-11-28",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2025-11-27",
      tradingHour: "",
    },
    {
      eventName: "Labor Day",
      atDate: "2025-09-01",
      tradingHour: "",
    },
    {
      eventName: "Independence Day",
      atDate: "2025-07-04",
      tradingHour: "",
    },
    {
      eventName: "Independence Day",
      atDate: "2025-07-03",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Juneteenth",
      atDate: "2025-06-19",
      tradingHour: "",
    },
    {
      eventName: "Memorial Day",
      atDate: "2025-05-26",
      tradingHour: "",
    },
    {
      eventName: "Good Friday",
      atDate: "2025-04-18",
      tradingHour: "",
    },
    {
      eventName: "Washington's Birthday",
      atDate: "2025-02-17",
      tradingHour: "",
    },
    {
      eventName: "Birthday of Martin Luther King, Jr",
      atDate: "2025-01-20",
      tradingHour: "",
    },
    {
      eventName: "New Year's Day",
      atDate: "2025-01-01",
      tradingHour: "",
    },
    {
      eventName: "Christmas",
      atDate: "2024-12-25",
      tradingHour: "",
    },
    {
      eventName: "Christmas",
      atDate: "2024-12-24",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2024-11-29",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Thanksgiving Day",
      atDate: "2024-11-28",
      tradingHour: "",
    },
    {
      eventName: "Labor Day",
      atDate: "2024-09-02",
      tradingHour: "",
    },
    {
      eventName: "Independence Day",
      atDate: "2024-07-04",
      tradingHour: "",
    },
    {
      eventName: "Independence Day",
      atDate: "2024-07-03",
      tradingHour: "09:30-13:00",
    },
    {
      eventName: "Juneteenth",
      atDate: "2024-06-19",
      tradingHour: "",
    },
  ],
  exchange: "US",
  timezone: "America/New_York",
}
