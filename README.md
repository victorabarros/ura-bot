<p align="center">
  <!-- cover image -->
  <img width="70%" src="https://raw.githubusercontent.com/victorabarros/ura-bot/main/assets/UraBot_profile01.png" />
</p>

# UraBot

<p>
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

# test endpoints
make healthcheck
make tweet

# automation tests
make tests

# build and run production version
make build
make run
```

## Endpoint

|verb|endpoint|description|
|:-:|:-:|:-:|
|GET|/health|healthcheck|
|POST|/tweet|tweet Uranium market stocks price in real time|

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

      finhub-..-server;

      %% styles
      classDef box fill-opacity:.5, stroke:grey, stroke-width:.5px;
      class cron,server,finhub,db,client box
```

## Monitoring

To monitor the bot's server, it's using the [Uptime Kuma](https://uptime.kuma.pet/), a self-hosted monitoring tool.
It has integration with Telegram, so if a heartbeat fails, it must send me a message on telegram.

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
- add reference to https://github.com/draftbit/twitter-lite
- improve body message (like
  - https://twitter.com/DolarBipolar/status/1458801696017113093
  - https://twitter.com/precodobitcoin/status/1460951202531794951
  - https://twitter.com/precodobitcoin/status/1480313562291658760
  - https://twitter.com/hashdex/status/1481672773554610181
  - https://twitter.com/MercadoBitcoin/status/1493942572166832134 and add font/vendor)
- https://github.com/victorabarros/ura-bot/issues/2 =>  / weekly report on friday night or Monday morning / monthly report on last day of month / quarter report
- add github actions => run tests
- write article: part 1 - first auto tweet serveless with finhub and tweet; part2 - cron and elephant sql (alternative to elephant is https://www.cockroachlabs.com/pricing/ or https://neon.tech/early-access/); part 3 - add query params and cron with goodmorning/evenning.
- variation D-1 D-7 D-30 D-90 interaction => happy, money, sad, booom
- add uranium/nuclear/energy icon 📉
- tweet relevant news (understand what's better hour and schedule it)
- codecov https://app.codecov.io/gh/victorabarros/ura-bot
- integration tests - get QA credentials
- read https://www.infoq.com/news/2021/11/twitter-api-v2
- data supplier alternative https://alpaca.markets/ | IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring
-->
