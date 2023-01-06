APP_NAME=ura-bot
APP_DIR=/${APP_NAME}/src
DOCKER_BASE_IMAGE=node:16.14.0
PORT=8080
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
		${DOCKER_BASE_IMAGE} bash -c "yarn && ${COMMAND}"

remove-containers:
ifneq ($(shell docker ps -a --filter "name=${APP_NAME}" -aq 2> /dev/null | wc -l | bc), 0)
	@echo "${YELLOW}Removing containers${COLOR_OFF}"
	@docker ps -a --filter "name=${APP_NAME}" -aq | xargs docker rm -f
endif

build:
	@echo "${YELLOW}Building project${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn install"
	@make -s remove-containers

run: build
	@clear
	@echo "${YELLOW}Running project${COLOR_OFF}"
	@make -s docker-command ENV_FILE=.env COMMAND="yarn start"

dev:
	@clear
	@echo "${YELLOW}Running ${APP_NAME} on port ${PORT}${COLOR_OFF}"
	@make -s docker-command ENV_FILE=.env COMMAND="yarn dev"

tests:
	@clear
	@make -s build ENV_FILE=".env.test"
	@echo "${YELLOW}Testing${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn test"

migration:
	@clear
	@echo "${YELLOW}Executing Migrations${COLOR_OFF}"
	@make -s docker-command COMMAND="yarn sequelize db:migrate"

healthcheck:
	@curl ${URL}health

tweet:
	@curl -X POST --header 'Authorization: ${API_KEY}' ${URL}tweet
