APP_NAME=ura-bot
PORT?=8082

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

.PHONY: welcome install dev build start typecheck clean \
        docker-build docker-run docker-stop docker-logs docker-clean

# ── Local (Node) ────────────────────────────────────────────────────────────

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

install:
	npm install

dev: install
	npm run dev

build: install
	npm run build

start: build
	npm run start

typecheck:
	npm run typecheck

clean:
	rm -rf dist node_modules

# ── Docker ──────────────────────────────────────────────────────────────────

docker-build:
	docker build -t $(APP_NAME):latest .

docker-run: docker-build
	docker run --rm -d \
		--name $(APP_NAME) \
		--env-file .env \
		-p $(PORT):$(PORT) \
		$(APP_NAME):latest

docker-stop:
	docker stop $(APP_NAME) 2>/dev/null || true

docker-logs:
	docker logs -f $(APP_NAME)

docker-clean: docker-stop
	docker rmi $(APP_NAME):latest 2>/dev/null || true
