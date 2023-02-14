using System;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using UraBotDotNet.Services;

namespace UraBotDotNet;


public class UraBot
{
  public string[] StockSymbols = new string[]
  {
    "CCJ", "DNN", "NXE", "UEC", "URA", "URNM", "UUUU", "SRUUF", "PDN", "UROY",
  };

  [FunctionName("UraBot")]
  public async Task Run([TimerTrigger("0 0 14-21 * * 1-5")] TimerInfo myTimer, ILogger log)
  {
    log.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}, {myTimer}");

    var fin = new Finhub(log);
    var quote = await fin.GetQuote("URA");

    log.LogInformation(quote.ToString());
  }
}
