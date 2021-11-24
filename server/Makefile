APP_NAME=ura-bot
APP_DIR=/${APP_NAME}/src
DOCKER_BASE_IMAGE=node:16.13
URL?=http://localhost:${PORT}/
ENV_FILE?=.env
COMMAND?=bash
PORT=3101
API_KEY=McChickenPromo

remove-containers:
ifneq ($(shell docker ps -a --filter "name=${APP_NAME}" -aq 2> /dev/null | wc -l | bc), 0)
	@echo "\e[1m\033[33mRemoving containers\e[0m"
	@docker ps -a --filter "name=${APP_NAME}" -aq | xargs docker rm -f
endif

docker-command: remove-containers
	@docker run -it -v $(shell pwd):${APP_DIR} -w ${APP_DIR} \
    --env-file ${ENV_FILE} \
    --env PORT=${PORT} \
    --env API_KEY=${API_KEY} \
		-p ${PORT}:${PORT} --name ${APP_NAME} \
		${DOCKER_BASE_IMAGE} bash -c "${COMMAND}"

build:
	@make docker-command COMMAND="rm -rf ./dist/*"
	@echo "\e[1m\033[33mBuilding project\e[0m"
	@make docker-command COMMAND="yarn build"
	@make remove-containers

run: build
	@clear
	@echo "\e[1m\033[33mRunning project\e[0m"
	@make docker-command COMMAND="yarn start"

dev:
	@clear
	@echo "\e[1m\033[33mRunning ${APP_NAME} on port ${PORT}\e[0m"
	@make docker-command COMMAND="yarn dev"

tests:
	@make build ENV_FILE=".env.test"
	@echo "\e[1m\033[33mTesting\e[0m"
	@make docker-command ENV_FILE=".env.test" COMMAND="yarn test"
	@echo "\e[1m\033[33mDone\e[0m"

healthcheck:
	@curl ${URL}health

tweet:
	@curl -X POST --header 'Authorization: ${API_KEY}' ${URL}tweet

prod-healthcheck:
	@make healthcheck URL=https://ura-bot-server.herokuapp.com/
