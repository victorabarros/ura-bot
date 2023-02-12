using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Text;
using Newtonsoft.Json.Linq;
using System.Net.Http;

namespace UraBotDotNet.Services;

public class Finhub
{
  private readonly string baseAddress = Environment.GetEnvironmentVariable("FINNHUB_ADDRESS");
  private readonly string token = Environment.GetEnvironmentVariable("FINNHUB_API_KEY");

  public async Task GetQuote(string symbol) {
      var url = $"{baseAddress}quote?symbol={symbol}&token={token}";

    using HttpClient httpClient = new();
    using HttpResponseMessage response = await httpClient.GetAsync(url);

    response.EnsureSuccessStatusCode();

    var jsonResponse = await response.Content.ReadAsStringAsync();
    Console.WriteLine($"{jsonResponse}\n");
    }
}
