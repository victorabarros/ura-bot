using UraBotDotNet.Services;

namespace UraBotDotNet.Models
{
  public class Quote
  {
    public string symbol { get; set; }
    public decimal price { get; set; }
    public decimal highPrice { get; set; }
    public decimal lowPrice { get; set; }
    public decimal openPrice { get; set; }
    public decimal previousClosePrice { get; set; }

    public Quote()
    {
    }

    public Quote(GetQuoteResponse getQuoteResponse)
    {
      this.price = getQuoteResponse.c;
      this.highPrice = getQuoteResponse.h;
      this.lowPrice = getQuoteResponse.l;
      this.openPrice = getQuoteResponse.o;
      this.previousClosePrice = getQuoteResponse.pc;
    }
  }
}
