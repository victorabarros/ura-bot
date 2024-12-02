APP_NAME=ura-bot-server
APP_DIR=/${APP_NAME}/src
DOCKER_BASE_IMAGE=node:20.14.0
PORT=8082
URL?=http://localhost:${PORT}/
PROD_URL=https://api.uraniumstockbot.com/
ENV_FILE?=.env
COMMAND?=bash
API_KEY=McChickenPromo

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

welcome:
	@clear
	@echo "${BOLD_YELLOW}"
	@echo " ____ ___                   __________             __   " && sleep .02
	@echo "|    |   \ _______  _____   \______   \   ____   _/  |_ " && sleep .02
	@echo "|    |   / \_  __ \ \__  \   |    |  _/  /  _ \  \   __\ " && sleep .02
	@echo "|    |  /   |  | \/  / __ \_ |    |   \ (  <_> )  |  |  " && sleep .02
	@echo "|______/    |__|    (____  / |______  /  \____/   |__|  " && sleep .02
	@echo "                        \/         \/                  " && sleep .02
	@echo "${NOCOLOR}"
	@# http://patorjk.com/software/taag font Graffiti full

docker-command: remove-containers
	@docker run -it -v $(shell pwd):${APP_DIR} -w ${APP_DIR} \
    --env-file ${ENV_FILE} \
    --env PORT=${PORT} \
    --env API_KEY=${API_KEY} \
		-p ${PORT}:${PORT} --name ${APP_NAME} \
		${DOCKER_BASE_IMAGE} bash -c "${COMMAND}"

remove-containers:
ifneq ($(shell docker ps -a --filter "name=${APP_NAME}" -aq 2> /dev/null | wc -l | bc), 0)
	@echo "${YELLOW}Removing containers${COLOR_OFF}"
	@docker ps -a --filter "name=${APP_NAME}" -aq | xargs docker rm -f
endif

# commands to debug and run w/ hot reload

debug: docker-command

debug-server:
	@clear
	@make welcome
	@echo "${YELLOW}Running ${APP_NAME} on port ${PORT}${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn dev"

# commands to run test

test-server:
	@reset
	@make welcome
	@echo "${YELLOW}Testing${COLOR_OFF}"
	@rm -rf coverage/
	@make -s docker-command ENV_FILE=.env.test COMMAND="yarn test"
	@open coverage/index.html

# commands to build and run like prod

build-server-image:
	@clear
	@echo "${YELLOW}Building project${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn install"
	@make -s docker-command COMMAND="yarn build"

run-server:
	@clear
	@make welcome
	@echo "${YELLOW}Running project${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn start"

# commands to hit local

curl-heart:
	curl -v ${URL}heartbeat

curl-ura-stocks:
	curl -v -X POST --header 'Authorization: ${API_KEY}' ${URL}urabot/stocks

curl-ura-news:
	curl -v -X POST --header 'Authorization: ${API_KEY}' ${URL}urabot/news

# commands to hit production

curl-heart-prod:
	@make curl-heart URL=${PROD_URL}

curl-ura-stocks-prod:
	@make curl-ura-stocks URL=${PROD_URL}

curl-ura-news-prod:
	@make curl-ura-news URL=${PROD_URL}
