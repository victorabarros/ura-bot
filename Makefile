APP_NAME=ura-bot
PORT?=8082
OLLAMA_MODEL?=qwen2.5:7b

YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

.PHONY: welcome install dev build start typecheck lint validate clean \
        docker-build docker-run docker-dev docker-stop docker-logs docker-clean

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

# ── Local (Node) ────────────────────────────────────────────────────────────

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

lint:
	npm run lint

validate:
	npm run validate

clean:
	rm -rf dist node_modules

# ── Docker ──────────────────────────────────────────────────────────────────

docker-build:
	docker build -t $(APP_NAME):latest .

docker-run: docker-build
	docker run --rm \
		--name $(APP_NAME) \
		--env-file .env \
		-p $(PORT):$(PORT) \
		$(APP_NAME):latest

docker-dev:
	docker build --target builder -t $(APP_NAME):dev .
	docker run --rm -it \
		--name $(APP_NAME)-dev \
		--env-file .env \
		-p $(PORT):$(PORT) \
		-v $(PWD)/src:/app/src \
		$(APP_NAME):dev \
		npm run dev

docker-stop:
	docker stop $(APP_NAME) 2>/dev/null || true

docker-logs:
	docker logs -f $(APP_NAME)

docker-clean: docker-stop
	docker rmi $(APP_NAME):latest 2>/dev/null || true

# ── Git ─────────────────────────────────────────────────────────────────

commit-llm-generated:
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
	printf '🦙 ollama generated' >> "$$msg_file"; \
	printf '%s\n' 'Generated commit message:'; \
	cat "$$msg_file"; \
	printf '\n'; \
	commit_msg="$$(perl -pe 's/\e\[[0-9;?]*[ -\/]*[@-~]//g' "$$msg_file")"; \
	rm -f "$$msg_file"; \
	git commit -m "$$commit_msg"

push p:
	git add .
	make commit-llm-generated
	git push

checkout c:
	git stash
	git checkout main
	git pull
	git stash pop
