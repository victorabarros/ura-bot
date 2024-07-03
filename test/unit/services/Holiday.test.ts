import { isHoliday, holidayMessage } from "../../../src/services/Holidays"

describe("Test Services Holiday", () => {
  describe("is holiday", () => {
    it("Jul 4 - Independence Day", async () => {
      const now = new Date(2024, 6, 4, 12)

      expect(isHoliday(now)).toBeTruthy()
      expect(holidayMessage(now)).toEqual(
        "Today is Independence Day 🎇🎇🎇\nCelebrate with your family and friends\nAnd always remember FREEDOM IS NOT FREE!"
      )
    })
  })
})
