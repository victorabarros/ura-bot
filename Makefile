APP_NAME=ura-bot
APP_DIR=/${APP_NAME}/src
DOCKER_BASE_IMAGE=node:16.14.0
PORT=8082
URL?=http://localhost:${PORT}/
ENV_FILE?=.env.test
COMMAND?=bash
API_KEY=McChickenPromo

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

docker-command: remove-containers
	@docker run -it -v $(shell pwd):${APP_DIR} -w ${APP_DIR} \
    --env-file ${ENV_FILE} \
    --env PORT=${PORT} \
    --env API_KEY=${API_KEY} \
		-p ${PORT}:${PORT} --name ${APP_NAME} \
		${DOCKER_BASE_IMAGE} bash -c "${COMMAND}"

debug: docker-command

remove-containers:
ifneq ($(shell docker ps -a --filter "name=${APP_NAME}" -aq 2> /dev/null | wc -l | bc), 0)
	@echo "${YELLOW}Removing containers${COLOR_OFF}"
	@docker ps -a --filter "name=${APP_NAME}" -aq | xargs docker rm -f
endif

build:
	@clear
	@echo "${YELLOW}Building project${COLOR_OFF}"
	@make -s docker-command ENV_FILE=.env COMMAND="yarn build"

run:
	@clear
	@echo "${YELLOW}Running project${COLOR_OFF}"
	@make build
	@make -s docker-command ENV_FILE=.env COMMAND="yarn start"

run-dev:
	@clear
	@echo "${YELLOW}Running ${APP_NAME} on port ${PORT}${COLOR_OFF}"
	@make -s docker-command ENV_FILE=.env COMMAND="yarn dev"

tests:
	@reset
	@echo "${YELLOW}Testing${COLOR_OFF}"
	@make -s docker-command ENV_FILE=.env.test COMMAND="yarn test"
	@open coverage/index.html

# migration:
# 	@clear
# 	@echo "${YELLOW}Executing Migrations${COLOR_OFF}"
# 	@make -s docker-command COMMAND="yarn sequelize db:migrate"

healthcheck:
	curl -v ${URL}health

heart:
	curl -v ${URL}heartbeat

tweet-ura-stocks:
	curl -v -X POST --header 'Authorization: ${API_KEY}' ${URL}urabot/stocks

tweet-ura-news:
	curl -v -X POST --header 'Authorization: ${API_KEY}' ${URL}urabot/news

tweet-brl-price:
	curl -v -X POST --header 'Authorization: ${API_KEY}' ${URL}brlbot/prices

prod-tweet-ura-stocks:
	curl -v -X POST --header 'Authorization: ${API_KEY}' https://api.uraniumstockbot.com/urabot/stocks
  # tweet-ura-stocks URL="https://api.uraniumstockbot.com/"
