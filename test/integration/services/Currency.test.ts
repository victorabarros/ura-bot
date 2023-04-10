import CurrencyService, { Currency } from "../../../src/services/Currency"

describe("Test Services Currency", () => {

  describe("get currency values", () => {
    it("success", async () => {
      const resp = await CurrencyService.getBrlValues()

      Object.keys(resp).forEach((key) => {
        const currency: Currency = (resp as any)[key]
        const { value, symbol } = currency

        expect(value).toBeGreaterThan(0)
        expect(symbol).toBe(key.toUpperCase())
      })
    })
  })

})
