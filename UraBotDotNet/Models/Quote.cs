using System;
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

    public Quote(GetQuoteResponse getQuoteResponse)
    {
      price = getQuoteResponse.c;
      highPrice = getQuoteResponse.h;
      lowPrice = getQuoteResponse.l;
      openPrice = getQuoteResponse.o;
      previousClosePrice = getQuoteResponse.pc;
    }
  }
}

