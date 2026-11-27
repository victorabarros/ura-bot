# App image, local server, tests, and lint.
# These targets run on the engineer machine and use Docker.

APP_NAME=ura-bot
PORT?=8082

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

DOCKER_TARGET?=
DOCKER_TAG?=latest

.PHONY: welcome build run dev test docker-test lint typecheck \
        purge-containers purge-images

welcome:
	@clear
	@echo "${YELLOW}"
	@echo " ____ ___                   __________             __   " && sleep .02
	@echo "|    |   \ _______  _____   \______   \   ____   _/  |_ " && sleep .02
	@echo "|    |   / \_  __ \ \__  \   |    |  _/  /  _ \  \   __\ " && sleep .02
	@echo "|    |  /   |  | \/  / __ \_ |    |   \ (  <_> )  |  |  " && sleep .02
	@echo "|______/    |__|    (____  / |______  /  \____/   |__|  " && sleep .02
	@echo "                        \/         \/                  " && sleep .02
	@echo "${COLOR_OFF}"
	@# http://patorjk.com/software/taag font Graffiti full

build:
	@if docker image inspect $(APP_NAME):$(DOCKER_TAG) > /dev/null 2>&1; then \
		echo "Image $(APP_NAME):$(DOCKER_TAG) already exists, skipping build."; \
	else \
		docker build \
			$(if $(DOCKER_TARGET),--target $(DOCKER_TARGET)) \
			-t $(APP_NAME):$(DOCKER_TAG) .; \
	fi

run:
	@make build
	@make welcome
	@docker run --rm \
		--name $(APP_NAME) \
		--env-file .env \
		-p $(PORT):$(PORT) \
		$(APP_NAME):latest

dev d:
	@make build DOCKER_TARGET=builder DOCKER_TAG=dev
	@make welcome
	@docker run --rm -it \
		--name $(APP_NAME)-dev \
		--env-file .env \
		-p $(PORT):$(PORT) \
		-v $(PWD)/src:/app/src \
		-v $(PWD)/public:/app/public \
		$(APP_NAME):dev \
		npm run dev

test t:
	@make build DOCKER_TARGET=test DOCKER_TAG=test
	@docker run --rm --name $(APP_NAME)-test $(APP_NAME):test

docker-test:
	@$(MAKE) test

lint:
	@make build DOCKER_TARGET=test DOCKER_TAG=test
	@docker run --rm --entrypoint npm --name $(APP_NAME)-lint $(APP_NAME):test run lint

typecheck:
	@make build DOCKER_TARGET=test DOCKER_TAG=test
	@docker run --rm --entrypoint npm --name $(APP_NAME)-typecheck $(APP_NAME):test run typecheck

purge-containers:
	@containers=$$(docker ps -aq --filter "name=$(APP_NAME)"); \
	if [ -n "$$containers" ]; then \
		echo "Removing containers: $$containers"; \
		docker rm -f $$containers; \
	else \
		echo "No containers found for $(APP_NAME)."; \
	fi

purge-images:
	@images=$$(docker images -q "$(APP_NAME)"); \
	if [ -n "$$images" ]; then \
		echo "Removing images: $$images"; \
		docker rmi -f $$images; \
	else \
		echo "No images found for $(APP_NAME)."; \
	fi
