<p align="center">
  <!-- cover image -->
  <img width="70%" src="https://raw.githubusercontent.com/victorabarros/ura-bot/main/assets/UraBot_profile01.png" />
</p>

# UraBot

<p>
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
  <a href="https://nostr.com/" target="_blank">
    <img
      height="22px"
      src="https://avatars.githubusercontent.com/u/103332273?s=200&v=4"
      style="background-color:black;padding:5px 10px;border-radius:3px"
    />
  </a>
</p>

**[Twitter](https://twitter.com/UraniumStockBot)** and **[Nostr](https://snort.social/nprofile1qqsywtsnwnzf3syaahw559evnj6k0nlgdcm3kwsfyk39a7umx9mykmcdfu3ps)** page dedicated to sharing uranium market stock prices, analyses and relevant news.

<p align="center">
  <!-- Update screenshot with one more recent -->
  <a href="https://twitter.com/UraniumStockBot/status/1470423280712654850">
    <img src="./assets/Tweet_v2.png" />
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
make tweet-ura-stocks
make tweet-ura-news

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
|POST|/stocks/urabot|post Uranium market stocks price in real time|
|POST|/news/urabot|post Uranium market news|

## Flow

```mermaid
    flowchart LR;

      %% components
      cron[cron];
      server[UraBot<br>Server];
      finhub[finhub];
      client[twitter];
      client2[nostr];

      %% flow
      cron--->
      server--->
      client;
      server--->
      client2;

      finhub----
      server;

      %% styles
      classDef box fill-opacity:.5, stroke:grey, stroke-width:.5px;
      class cron,server,finhub,db,client,client2 box
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
- more stocks https://twitter.com/FayeKnoozIV/status/1806373643435282575
- https://x.com/derekrogden/status/1797668427936731459
- references https://www.postman.com/twitter/workspace/twitter-s-public-workspace/request/9956214-c936778b-e343-4a23-b1b4-433c501cf6eb?ctx=code
- add welcome script https://github.com/victorabarros/CS50chain/blob/0e071b7af8851ef92791a1f068ed679f6da14ac4/Makefile#L11
- alternative to railway: https://render.com/
- weekly report on friday night or Monday morning / monthly report on last day of month / quarter report; example https://twitter.com/precodobitcoin/status/1480313562291658760
- add github actions => run tests on pr opened
- write article:
  - https://medium.com/p/152d197194/edit
  - part 1 - first auto tweet serveless with finhub and tweet
  - part 2 - cron and elephant sql (alternative to elephant is https://www.cockroachlabs.com/pricing/ or https://neon.tech/early-access/)
  - part 3 - add query params and cron with goodmorning/evenning.
- codecov https://app.codecov.io/gh/victorabarros/ura-bot
- data supplier alternative https://alpaca.markets/ | IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring
- is it possible to use a giphy api to add gif to news post? same to chart
-->
