using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using UraBotDotNet.Models;
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

    var fin = new Finhub();
    var tasks = new List<Task<Quote>>();

    foreach (var q in StockSymbols)
    {
      tasks.Add(Task.Run(async () =>
      {
        try
        {
          return await fin.GetQuote(q);
        }
        catch
        {
          log.LogError($"fail to request quote {q}");
          return new Quote();
        }
      }));
    }

    var quotes = await Task.WhenAll(tasks);

    log.LogInformation(quotes.ToString());
  }
}
