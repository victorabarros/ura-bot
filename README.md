# Bots

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

Powered with AI.

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
```

## Endpoint

|     endpoint      |                   description                             |
|-------------------|-----------------------------------------------------------|
|**POST** /brlbot/prices|post Brazilian **Real price** in other intl currencies |
|**GET**  /heartbeat    |heartbeat                                              |

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

- getCurrenciesValues is not working. API changed the response contract
- implement async ReplicateAIService.BuildImage(prompt: string): Promise<string>; copy from here https://github.com/victorabarros/Learning/blob/master/replicate/index.js
- add star history like this https://github.com/afadil/wealthfolio/blob/f771dff685a2462aa7deb03cb69adf24e97bd780/README.md?plain=1#L160C35-L160C55
- fix tests and use script "test": "jest --coverage"
- is it possible to use a giphy api to add gif to news post?
- code website from this: https://github.com/victorabarros/ura-bot/commit/5c3ba215043e6adcb287bec03d4c0656edcff181


- codecov https://app.codecov.io/gh/victorabarros/ura-bot
- create cover image to BRL bot (use ai to https://x.com/LeonardoAi_)
- alternative to railway: https://render.com/
- add prompt to makefile.welcome
-->
