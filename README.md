<p align="center">
  <!-- cover image -->
  <img width="70%" src="https://raw.githubusercontent.com/victorabarros/ura-bot/main/assets/UraBot_profile01.png" />
</p>

# UraBot

<p>
  <!-- badgets -->
  <a href="https://www.easycron.com/user">
    <img height="30px" src="https://www.easycron.com/apple-touch-icon-180x180.png" />
  </a>
  <a href="https://dashboard.heroku.com/apps/ura-bot-server">
    <img height="30px" src="https://www.herokucdn.com/deploy/button.svg" />
  </a>
  <a href="https://codeclimate.com/github/victorabarros/ura-bot">
  <!-- TODO add to CI -->
    <img src="https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability" />
  </a>
</p>

Page dedicated to share uranium market stock prices, analyses and relevant news.

<p align="center">
  <a href="https://twitter.com/UraniumStockBot">
    <img height="50px" src="https://upload.wikimedia.org/wikipedia/pt/thumb/3/3d/Twitter_logo_2012.svg/1200px-Twitter_logo_2012.svg.png" />
  </a>
</p>

## How to run

You can find all commands on [./server/Makefile](https://github.com/victorabarros/ura-bot/blob/main/server/Makefile)

write .env file similar to .env.example

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

- message:
  - ad more stock of uranium market
  - add Good Morning! -> when is the first tweet of the day
  - add See ya! -> when is the last tweet of the day
  - add Have a nice and sunny weekend! -> when is the last tweet of friday
  - improve body message (like https://twitter.com/DolarBipolar/status/1458801696017113093 https://twitter.com/precodobitcoin/status/1460951202531794951 and add font/vendor)
  - tweet relevant news (understand what's better hour and schedule it)
- CI
- integration tests - get QA credentials
-->
