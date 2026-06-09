APP_NAME=ura-bot
PORT?=8082


YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

.PHONY: welcome \
        build run dev test \
        purge-containers purge-images \
		commit-llm-generated push checkout

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

# ── Docker ──────────────────────────────────────────────────────────────────

DOCKER_TARGET?=
DOCKER_TAG?=latest

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

dev:
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

test:
	@make build DOCKER_TARGET=test DOCKER_TAG=test
	@docker run --rm --name $(APP_NAME)-test $(APP_NAME):test

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

# ── Git ─────────────────────────────────────────────────────────────────

OLLAMA_MODEL?=qwen2.5:7b

commit-llm-generated commit:
	git add .
	@msg_file="$$(mktemp)"; \
	{ \
		printf '%s\n\n' 'Write the final git commit message for the staged changes.'; \
		printf '%s\n' 'Return only the commit message text that should be passed to git commit.'; \
		printf '%s\n' 'Do not repeat these instructions.'; \
		printf '%s\n' 'Do not include markdown, code examples, code fences, labels, quotes, explanations, or diff summaries.'; \
		printf '%s\n' 'Use imperative mood.'; \
		printf '%s\n' 'Keep the subject line under 72 characters.'; \
		printf '%s\n' 'Add a short body only if it materially improves clarity.'; \
		printf '%s\n' 'If there is a body, separate it from the subject with one blank line.'; \
		printf '\n%s\n' 'git status --short:'; \
		git status --short; \
		printf '\n%s\n' 'git diff --cached --stat:'; \
		git diff --cached --stat; \
		printf '\n%s\n' 'git diff --cached:'; \
		git diff --cached; \
	} | ollama run "$(OLLAMA_MODEL)" > "$$msg_file"; \
	printf '🦙 message generated with ollama' >> "$$msg_file"; \
	printf '%s\n' 'Generated commit message:'; \
	cat "$$msg_file"; \
	printf '\n'; \
	commit_msg="$$(perl -pe 's/\e\[[0-9;?]*[ -\/]*[@-~]//g' "$$msg_file")"; \
	rm -f "$$msg_file"; \
	git commit -m "$$commit_msg"

push p:
	make commit-llm-generated
	git push

checkout c:
	git stash
	git checkout main
	git pull
	git stash pop
