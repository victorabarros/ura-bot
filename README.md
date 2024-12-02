# UraBot

<p align="center">
  <!-- cover image -->
  <img width="70%" src="https://raw.githubusercontent.com/victorabarros/ura-bot/main/assets/UraBot_profile01.png" />
</p>

<!-- badges -->
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
  <!-- TODO add replicate ai badges -->
</p>

**[Twitter/X](https://x.com/UraniumStockBot)** and **[Nostr](https://snort.social/nprofile1qqsywtsnwnzf3syaahw559evnj6k0nlgdcm3kwsfyk39a7umx9mykmcdfu3ps)** page dedicated to sharing uranium market stock prices, analyses and relevant news.

Powered with AI.

<p align="center">
  <!-- TODO Update screenshot with one more recent like this https://x.com/UraniumStockBot/status/1861862634100080682-->
  <a href="https://x.com/UraniumStockBot/status/1470423280712654850">
    <img src="./assets/Tweet_v2.png" />
  </a>
</p>

## How to run

You can find all commands on [Makefile](./Makefile)

write .env file similar to .env.example

```sh
# automated tests
make test-server

# locally run with hot reload
make debug-server

# build and run production version
make build-server-image
make run-server

# hit api
make curl-heart
make curl-ura-stocks
make curl-ura-news
```

## Endpoint

|     endpoint      |                   description                             |
|-------------------|-----------------------------------------------------------|
|**POST** /urabot/stocks|post Uranium market **stocks price** in real time      |
|**POST** /urabot/news  |post Uranium market **news** commented with AI analysis|
|**POST** /brlbot/prices|post Brazilian **Real price** in other intl currencies |
|**GET**  /heartbeat    |heartbeat                                              |

## Flow

![demo](flow.excalidraw.png)

## Monitoring

To monitor the bot's server, it's using the [Uptime Kuma](https://uptime.kuma.pet/), a self-hosted monitoring tool.
It has integration with Telegram, so if a heartbeat fails it sends a message on telegram.

## Support

I'm more than happy to be honored with your support.

<p>
  <a href="https://www.buymeacoffee.com/victorbarros" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" height="45px">
  </a>

  <a href="https://victorabarros.github.io/wallet" target="_blank">
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

- use a shorten url, like bit.ly to here https://github.com/victorabarros/ura-bot/blob/01f61decb275db894bbe87b248038b04f41e2dbf/src/controller/Uranium.ts#L126
- use redis cache to isFirstPostOfDay https://github.com/victorabarros/ura-bot/blob/01f61decb275db894bbe87b248038b04f41e2dbf/src/controller/Uranium.ts#L170
- replicate if !holidayDetail.message, use replicate to generate a holiday message. Maybe with a image. https://github.com/victorabarros/ura-bot/blob/71d7cf7950786f53748a59da57042cb7501db8b1/src/services/Holidays.ts#L220
- implement async ReplicateAIService.BuildImage(prompt: string): Promise<string>; copy from here https://github.com/victorabarros/Learning/blob/master/replicate/index.js
- reduce nof post per day
  - 4 posts w/ news
  - 4 posts w/ stocks
- add star history like this https://github.com/afadil/wealthfolio/blob/f771dff685a2462aa7deb03cb69adf24e97bd780/README.md?plain=1#L160C35-L160C55
- fix tests and use script "test": "jest --coverage"
- reports
  - quarter report; example https://twitter.com/precodobitcoin/status/1480313562291658760;
  - weekly report on friday night or Monday morning
  - monthly report on last day of month
    - look for chart libray to plot graph
    - include comment with AI
- is it possible to use a giphy api to add gif to news post?
- code website from this: https://github.com/victorabarros/ura-bot/commit/5c3ba215043e6adcb287bec03d4c0656edcff181

- write article:
  - https://medium.com/p/152d197194/edit
  - part 1 - first auto tweet serveless with finhub and tweet
  - part 2 - cron and elephant sql (alternative to elephant is https://www.cockroachlabs.com/pricing/ or https://neon.tech/early-access/)
  - part 3 - add query params and cron with goodmorning/evenning.

- other stocks:
  - find another api that supports the stocks above. alternatives: data supplier alternative https://alpaca.markets/ | IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring | https://marketstack.com/ | yahoo finance api
  - alternatives to currency prices https://fixer.io/
  - $URM https://twitter.com/TheTSXDude/status/1631066976666763266?s=20
  - $NANO https://twitter.com/FayeKnoozIV/status/1806373643435282575
  - $SPUT https://x.com/derekrogden/status/1797668427936731459

- codecov https://app.codecov.io/gh/victorabarros/ura-bot
- create cover image to BRL bot (use ai to https://x.com/LeonardoAi_)
- alternative to railway: https://render.com/
-->
