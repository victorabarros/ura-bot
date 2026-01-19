# TODO

<!--
- codecov https://app.codecov.io/gh/victorabarros/ura-bot
-->

## code debts

- change API data source https://x.com/UraniumStockBot/status/2013055122486542519?s=20
- use /internal/... path to internal routes and improve this rule https://github.com/victorabarros/ura-bot/blob/71d7cf7950786f53748a59da57042cb7501db8b1/src/midleware.ts#L11 of oauth
- use Promise.allSettled instead of Promise.all
- add script test to package.json
  - fix tests and use script "test": "jest --coverage"
  - after fixed, re-introdude to ./nixpacks.toml:
    [phases.test]
    cmds = ["yarn test"]
    dependsOn = ["build"]

- re-introduce husky to code
- use redis cache to isFirstPostOfDay and evenningMessage https://github.com/victorabarros/ura-bot/blob/01f61decb275db894bbe87b248038b04f41e2dbf/src/controller/Uranium.ts#L170

## code improvement

- insert post details to DB
- create react-native-web app w/ [uraniumstockbot.com](http://uraniumstockbot.com/) address [link](https://github.com/victorabarros/ura-bot/blob/c4393555f47b3a56d0c11b8a230151a893054413/README.md?plain=1#L130) | (https://account.squarespace.com/domains/managed/uraniumstockbot.com) and victor.barros.engineer/urabot ; same content of read plus footer from victor.barros.engineer
  - use this link in the bio ; readme and more ...
  - try add widget w/ view from x/twitter and nostr
- use Fatify instead of express - https://www.thoughtworks.com/radar/languages-and-frameworks/fastify

## product improvement

- improve data source to have better news https://x.com/paulmitche24045/status/1943767794513772602
- registrar nome no impo https://youtu.be/OAIjQSDdFcs?si=RbuI5VAX-_bstXkp
- replicate if !holidayDetail.message, use replicate to generate a holiday message. Maybe with a image. https://github.com/victorabarros/ura-bot/blob/71d7cf7950786f53748a59da57042cb7501db8b1/src/services/Holidays.ts#L220 > Use Replicate to create a message on holiday
- also look for top trending and republish with a comment (ai here too)
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
  - find another api alternatives that supports the stocks above
    - data supplier alternative https://alpaca.markets/
    - IEX https://cs50.harvard.edu/x/2022/psets/9/finance/#configuring
    - https://marketstack.com/
    - yahoo finance api https://ranaroussi.github.io/yfinance/
    - https://github.com/gadicc/node-yahoo-finance2
    - https://fixer.io/
    - https://www.quantiq.live/
  - $URM https://twitter.com/TheTSXDude/status/1631066976666763266?s=20
  - $NANO https://twitter.com/FayeKnoozIV/status/1806373643435282575
  - $SPUT https://x.com/derekrogden/status/1797668427936731459
  - HURA // ETF
  - U.U
  - U.UN // Sprott: physical uranium trust
  - UXC // Future Contract
- https://x.com/Speculator_io/status/1970210948104462833
  - Small Modular & Micro Reactors $OKLO Oklo $SMR NuScale $NNE NANO Nuclear $GEV GE Vernova $RYCEF Rolls-Royce $BWXT BWX Technologies
  - Uranium Enrichers $LEU Centrus Energy $ASPI ASP Isotopes
  - Nuclear Fuel Technology $LTBR Lightbridge
  - Services and Equipment $CW Curtiss-Wright $MIR Mirion Technologies $FLR Fluor $BEPC Brookfield Renewables $BWXT BWX Technologies $GEV GE Vernova $ATRL AtkinsRealis (CN) $ARE Aecon (CN)
  - Power Producers $CEG Constellation Energy $VST Vistra $TLN Talen Energy $PEG Public Service Enterprise Group
  - Uranium Producers $CCJ Cameco $UEC Uranium Energy $BHP BHP Group $URG Ur-Energy $EU enCore Energy $EFR Energy Fuels (CN)
  - Developers $UUUU Energy Fuels $NXE NextGen Energy $LITM Snow Lake $DML Denison Mines (CN) $ISO Iso Energy (CN) $LAM Lamamide Resources (CN)
  - Uranium+Nuclear ETFs $NLR VanEck Uranium+Nuclear ETF $URA Global X Uranium ETF $URNM Sprott Uranium Miners ETF $NUKZ  Nuclear Renaissance ETF

## public

- add star history like this https://github.com/afadil/wealthfolio/blob/f771dff685a2462aa7deb03cb69adf24e97bd780/README.md?plain=1#L160C35-L160C55
