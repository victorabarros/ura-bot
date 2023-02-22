using System;
using System.Net;
using System.Threading.Tasks;
using Tweetinvi;
using Tweetinvi.Core.Models;
using Tweetinvi.Models;
using Tweetinvi.Parameters;

namespace UraBotDotNet.Services;

public class Twitter
{
  public async Task PublishTweet()
  {
    var _credentials = new TwitterCredentials(API_KEY, API_KEY_SECRET, BEARER_TOKEN);
    var client = new TwitterClient(_credentials);
    client.CreateRequest();
    client.TweetsV2.GetTweetsAsync();

    var publishTweetParameters = new PublishTweetParameters("message");

    var publishedTweet = await client.Tweets.PublishTweetAsync(publishTweetParameters);

  }
}
