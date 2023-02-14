using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Text;
using Newtonsoft.Json.Linq;
using System.Net.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using UraBotDotNet.Models;

namespace UraBotDotNet.Services;

public class Finhub
{
  private readonly string baseAddress =
    Environment.GetEnvironmentVariable("FINNHUB_ADDRESS");
  private readonly string token =
    Environment.GetEnvironmentVariable("FINNHUB_API_KEY");
  private HttpClient httpClient = new();
  private ILogger log;

  public Finhub(ILogger log)
  {
    this.log = log;
  }

  public async Task<Quote> GetQuote(string symbol)
  {
    var url = $"{baseAddress}quote?symbol={symbol}&token={token}";
    HttpResponseMessage response = await httpClient.GetAsync(url);

    response.EnsureSuccessStatusCode();

    var responseString = await response.Content.ReadAsStringAsync();
    log.LogInformation(responseString);

    var resp = JsonSerializer.Deserialize<GetQuoteResponse>(responseString);

    return new Quote(resp) { symbol = symbol };
  }
}

public class GetQuoteResponse
{
  public decimal c { get; set; }
  public decimal h { get; set; }
  public decimal l { get; set; }
  public decimal d { get; set; }
  public decimal o { get; set; }
  public decimal pc { get; set; }

  public decimal dp { get; set; }
  public int t { get; set; }
}
