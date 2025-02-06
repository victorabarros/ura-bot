# TODO

<!--
- add star history like this https://github.com/afadil/wealthfolio/blob/f771dff685a2462aa7deb03cb69adf24e97bd780/README.md?plain=1#L160C35-L160C55

- write article:
  - https://medium.com/p/152d197194/edit
  - part 1 - first auto tweet serveless with finhub and tweet
  - part 2 - cron and elephant sql (alternative to elephant is https://www.cockroachlabs.com/pricing/ or https://neon.tech/early-access/)
  - part 3 - add query params and cron with goodmorning/evenning.

- codecov https://app.codecov.io/gh/victorabarros/ura-bot
-->

## code debts

- use /internal/... path to internal routes and improve this rule https://github.com/victorabarros/ura-bot/blob/71d7cf7950786f53748a59da57042cb7501db8b1/src/midleware.ts#L11 of oauth
- use Promise.allSettled instead of Promise.all
- add script test to package.json
  - fix tests and use script "test": "jest --coverage"
- re-introduce husky to code
- use redis cache to isFirstPostOfDay and evenningMessage https://github.com/victorabarros/ura-bot/blob/01f61decb275db894bbe87b248038b04f41e2dbf/src/controller/Uranium.ts#L170

## code improvement

- use Bruno for dev collection
- insert post details to DB

## product improvement

- replicate if !holidayDetail.message, use replicate to generate a holiday message. Maybe with a image. https://github.com/victorabarros/ura-bot/blob/71d7cf7950786f53748a59da57042cb7501db8b1/src/services/Holidays.ts#L220
- use a shorten url, like bit.ly to here https://github.com/victorabarros/ura-bot/blob/01f61decb275db894bbe87b248038b04f41e2dbf/src/controller/Uranium.ts#L126 to avoid character limit
- implement async ReplicateAIService.BuildImage(prompt: string): Promise<string>; copy from here https://github.com/victorabarros/Learning/blob/master/replicate/index.js
- improve replicate prompt with this: https://github.com/f/awesome-chatgpt-prompts?tab=readme-ov-file#act-as-a-social-media-influencer
- is it possible to use a giphy api to add gif to news post?
- reports
  - quarter report; example https://twitter.com/precodobitcoin/status/1480313562291658760;
  - weekly report on friday night or Monday morning
  - monthly report on last day of month
    - look for chart libray to plot graph
    - include comment with AI

### more stocks

- "Please add ETF NUKZ" - https://x.com/lhthome/status/1882431883503714677
- other stocks:
  - find another api that supports the stocks above. alternatives: data supplier alternative https://alpaca.markets/ | IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring | https://marketstack.com/ | yahoo finance api
  - alternatives to currency prices https://fixer.io/
  - $URM https://twitter.com/TheTSXDude/status/1631066976666763266?s=20
  - $NANO https://twitter.com/FayeKnoozIV/status/1806373643435282575
  - $SPUT https://x.com/derekrogden/status/1797668427936731459
  - HURA // ETF
  - U.U
  - U.UN // Sprott: physical uranium trust
  - UXC // Future Contract

## public

- create landing page w/ react-native-web w/ [uraniumstockbot.com](https://account.squarespace.com/domains/managed/uraniumstockbot.com) and victor.barros.engineer/urabot ; same content of read plus footer from victor.barros.engineer
  - use this link in the bio ; readme and more ...
  - try add widget w/ view from x/twitter and nostr
