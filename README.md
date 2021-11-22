# UraBot

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://dashboard.heroku.com/apps/ura-bot-server)
<!-- https://www.easycron.com/user -->

https://twitter.com/UraniumStockBot

Page dedicated to share uranium market stock prices, analyses and relevant news.

## How to run

You can find all commands on [./server/Makefile](https://github.com/victorabarros/ura-bot/blob/main/server/Makefile)

```sh
# locally run with hot reload
make dev

# test endoint
make healthcheck
make tweet

# automation tests
make tests-unit

# build and run production version
make build
make run
```

## Endpoint

|verb|endpoint|description|
|:-:|:-:|:-:|
|GET|/health|healthcheck|
|POST|/tweet|tweet URA stock price in real time|

<!--
## Improvements

- CI
- improve body message (like https://twitter.com/DolarBipolar/status/1458801696017113093 https://twitter.com/precodobitcoin/status/1460951202531794951 and add font/vendor)
- tweet relevant news (understand what's better hour and schedule it)
- cover image
- code climate
- tests
- terraform
-->
