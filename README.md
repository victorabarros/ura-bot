<p align="center">
  <!-- cover image -->
  <img width="70%" src="https://raw.githubusercontent.com/victorabarros/ura-bot/main/assets/UraBot_profile01.png" />
</p>

# UraBot

<p>
  <a href="https://www.npmjs.com/package/twitter-lite" target="_blank">
    Twiiter Lite
  </a>
  <!-- badgets -->
  <a href="https://railway.app/" target="_blank">
    <img height="32px" src="https://railway.app/button.svg" />
  </a>
  </a>
  <a href="https://codeclimate.com/github/victorabarros/ura-bot" target="_blank">
    <img height="32px" src="https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability" />
  </a>
  </a>
  <a href="https://cron-job.org/en/" target="_blank">
    <img
      height="22px"
      src="https://cron-job.org/_next/image/?url=%2Fimages%2Flogo-darkbg.png&w=384&q=75"
      style="background-color:#c33d1b;padding:5px 10px;border-radius:3px"
    />
  </a>
  <a href="https://uptime.kuma.pet/" target="_blank">
    <img
      height="22px"
      src="https://uptime.kuma.pet/img/icon.svg"
      style="background-color:black;padding:5px 10px;border-radius:3px"
    />
  </a>
</p>

[Twitter](https://twitter.com/UraniumStockBot) page dedicated to sharing uranium market stock prices, analyses and relevant news.

<p align="center">
  <!-- Update screenshot with one more recent -->
  <a href="https://twitter.com/UraniumStockBot/status/1470423280712654850">
    <img src="./assets/Tweet.png" />
  </a>
</p>

## How to run

You can find all commands on [./Makefile](https://github.com/victorabarros/ura-bot/blob/main/Makefile)

write .env file similar to .env.example

```sh
# locally run with hot reload
make dev

# api requests
make healthcheck
make tweet-ura-stocks:
make tweet-ura-news:

# automated tests
make tests

# build and run production version
make build
make run
```

## Endpoint

|verb|endpoint|description|
|:-:|:-:|:-:|
|GET|/health|healthcheck|
|POST|/stocks/urabot|tweet Uranium market stocks price in real time|
|POST|/news/urabot|tweet Uranium market news|

## Flow

```mermaid
    flowchart LR;

      %% components
      cron[cron];
      server[UraBot<br>Server];
      finhub[finhub];
      client[twitter];

      %% flow
      cron--->
      server--->
      client;

      finhub----
      server;

      %% styles
      classDef box fill-opacity:.5, stroke:grey, stroke-width:.5px;
      class cron,server,finhub,db,client box
```

## Monitoring

To monitor the bot's server, it's using the [Uptime Kuma](https://uptime.kuma.pet/), a self-hosted monitoring tool.
It has integration with Telegram, so if a heartbeat fails it sends a message on telegram.

## Support

I'm more than happy to be honored with your support.

<p>
  <a href="https://www.buymeacoffee.com/victorbarros" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="45px">
  </a>

  <a href="https://website.victorbarros.dev/wallet" target="_blank">
    <img src="https://bitcoin.org/img/icons/logotop.svg?1671880122" height="40px">
  </a>
</p>

<p align="center">
  <br/>
  Made in Brazil
  <br/>
  <img src="https://user-images.githubusercontent.com/42843223/222024964-9494cd55-849c-40a3-8121-8fa00d575475.png" height="30px"/>
</p>

<!--
TODO:
- https://twitter.com/FL17112012/status/1652042085183225856
- add welcome script https://github.com/victorabarros/CS50chain/blob/0e071b7af8851ef92791a1f068ed679f6da14ac4/Makefile#L11
- alternative to railway: https://render.com/
- BRLbot
  - nomes:
    - real de tpm
    - real vale nada
- weekly report on friday night or Monday morning / monthly report on last day of month / quarter report; example https://twitter.com/precodobitcoin/status/1480313562291658760
- add github actions => run tests on pr opened
- write article:
  - https://medium.com/p/152d197194/edit
  - part 1 - first auto tweet serveless with finhub and tweet
  - part 2 - cron and elephant sql (alternative to elephant is https://www.cockroachlabs.com/pricing/ or https://neon.tech/early-access/)
  - part 3 - add query params and cron with goodmorning/evenning.
- tweet relevant news (understand what's better hour and schedule it)
- codecov https://app.codecov.io/gh/victorabarros/ura-bot
- read https://www.infoq.com/news/2021/11/twitter-api-v2
- data supplier alternative https://alpaca.markets/ | IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring
- references:
  -  https://developer.twitter.com/en/docs/tutorials/creating-a-twitter-bot-with-python--oauth-2-0--and-v2-of-the-twi
  -  https://sarahdepalo.hashnode.dev/create-a-twitter-bot-with-python#clamlkue800lu3dnv2a85fse4?t=1670010581400
- read:
  - https://github.com/plhery/node-twitter-api-v2 https://www.npmjs.com/package/twitter-api-v2
  - https://developer.twitter.com/en/docs/tutorials/customer-engagement-application-playbook
  - https://developer.twitter.com/en/docs/tutorials/how-to-build-a-complete-twitter-autoresponder-autohook
  - https://developer.twitter.com/en/docs/tutorials/step-by-step-guide-to-making-your-first-request-to-the-twitter-api-v2
  - https://developer.twitter.com/en/docs/tutorials/kickstart-your-twitter-bot-with-our-glitch-example-written-in-py
  - https://developer.twitter.com/en/docs/tutorials/building-a-live-leaderboard-on-twitter

curl "https://api.twitter.com/2/users/by/username/brlbot" -H "Authorization: Bearer AAAAAAAAAAAAAAAAAAAAALAHmwEAAAAABb0A5347FUCDtI%2BE7Jbha1BvndI%3DYBISJH6Rh0MtaUr5tcTbwhRjsnGVtCOrfIOqayC27GmdvkkQ4i"

curl --request GET 'https://api.twitter.com/2/tweets/search/recent?query=from:twitterdev' --header 'Authorization: Bearer AAAAAAAAAAAAAAAAAAAAALAHmwEAAAAABb0A5347FUCDtI%2BE7Jbha1BvndI%3DYBISJH6Rh0MtaUr5tcTbwhRjsnGVtCOrfIOqayC27GmdvkkQ4i'

curl --request POST \
  --url 'https://api.twitter.com/1.1/statuses/update.json?status=Hello%20world' \
  --header 'authorization: OAuth oauth_consumer_key="CONSUMER_API_KEY", oauth_nonce="OAUTH_NONCE", oauth_signature="OAUTH_SIGNATURE", oauth_signature_method="HMAC-SHA1", oauth_timestamp="OAUTH_TIMESTAMP", oauth_token="ACCESS_TOKEN", oauth_version="1.0"' \

-->
