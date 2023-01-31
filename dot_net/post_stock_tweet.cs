using System;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Host;
using Microsoft.Extensions.Logging;

namespace urabot_dot_net
{
    public class post_stock_tweet
    {
        [FunctionName("post_stock_tweet")]
        public void Run([TimerTrigger("0 0 14-21 * * 1-5")]TimerInfo myTimer, ILogger log)
        {
            log.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
        }
    }
}

