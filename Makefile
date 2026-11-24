APP_NAME=ura-bot
PORT?=8082


YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

.PHONY: welcome \
        build run dev test docker-test lint typecheck \
        purge-containers purge-images \
        tf-init tf-fmt tf-validate tf-plan tf-plan-summary tf-apply tf-import \
        shellcheck \
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

# ── Terraform (cron-job.org, state in Cloudflare R2) ────────────────────
# Official image, pinned. Mount only zarf/infra. Credentials come from the
# environment or a gitignored .env. They are not written into the image.

TF_IMAGE := hashicorp/terraform:1.17.2
TF_PLATFORM := linux/amd64
# cron-job.org allows 1 create per second and 5 per minute. One at a time.
TF_PARALLELISM ?= 1

TF_DOCKER = docker run --rm --platform $(TF_PLATFORM) \
	--user $(shell id -u):$(shell id -g) \
	-e TF_IN_AUTOMATION=1 \
	-e CRON_JOB_API_KEY \
	-e TF_VAR_bot_api_key \
	-e AWS_ACCESS_KEY_ID \
	-e AWS_SECRET_ACCESS_KEY \
	-v $(CURDIR)/zarf/infra:/workspace \
	-w /workspace \
	$(TF_IMAGE)

load_tf_env = \
	set -eu; \
	if [ -f .env ]; then set -a; . ./.env; set +a; fi; \
	export AWS_ACCESS_KEY_ID="$${AWS_ACCESS_KEY_ID:-$${R2_ACCESS_KEY_ID:-}}"; \
	export AWS_SECRET_ACCESS_KEY="$${AWS_SECRET_ACCESS_KEY:-$${R2_SECRET_ACCESS_KEY:-}}"; \
	export TF_VAR_bot_api_key="$${TF_VAR_bot_api_key:-$${API_KEY:-}}"

require_r2 = \
	if [ -z "$$AWS_ACCESS_KEY_ID" ] || [ -z "$$AWS_SECRET_ACCESS_KEY" ]; then \
		echo "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)."; \
		exit 1; \
	fi

require_cron = \
	if [ -z "$$CRON_JOB_API_KEY" ]; then echo "Set CRON_JOB_API_KEY."; exit 1; fi; \
	if [ -z "$$TF_VAR_bot_api_key" ]; then echo "Set API_KEY or TF_VAR_bot_api_key."; exit 1; fi

tf-init:
	@$(load_tf_env); \
	$(require_r2); \
	$(TF_DOCKER) init -input=false -reconfigure

SHELLCHECK_IMAGE ?= koalaman/shellcheck:stable

shellcheck:
	docker run --rm \
		-v $(CURDIR):/mnt \
		-w /mnt \
		$(SHELLCHECK_IMAGE) \
		zarf/infra/scripts/deploy-prod.sh

tf-fmt:
	@$(TF_DOCKER) fmt -recursive $(if $(CHECK),-check -diff,)

tf-validate:
	@docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e TF_DATA_DIR=/tmp/tfdata \
		-v $(CURDIR)/zarf/infra:/workspace \
		-w /workspace \
		--entrypoint sh \
		$(TF_IMAGE) \
		-c 'terraform init -backend=false -input=false && terraform validate'

tf-plan:
	@$(load_tf_env); \
	$(require_r2); \
	$(require_cron); \
	$(TF_DOCKER) init -input=false -reconfigure; \
	$(TF_DOCKER) plan -input=false -lock-timeout=5m -parallelism=$(TF_PARALLELISM) -out=tfplan

tf-plan-summary:
	@$(TF_DOCKER) show -json tfplan

tf-apply:
	@if [ ! -f zarf/infra/tfplan ]; then echo "Run make tf-plan first."; exit 1; fi
	@$(load_tf_env); \
	$(require_r2); \
	$(require_cron); \
	refuse_destroys() { \
		summary="$$($(TF_DOCKER) show -no-color tfplan | sed -n 's/^Plan: //p')"; \
		if [ -n "$$summary" ]; then echo "Plan: $$summary"; fi; \
		destroys="$$(printf '%s\n' "$$summary" | sed -n 's/.* \([0-9][0-9]*\) to destroy.*/\1/p')"; \
		if [ "$${destroys:-0}" != "0" ] && [ "$${TF_ALLOW_DESTROY:-}" != "1" ]; then \
			echo "Refusing apply because the plan destroys $${destroys} resource(s). Set TF_ALLOW_DESTROY=1 to override."; \
			exit 1; \
		fi; \
	}; \
	attempt=1; \
	max_attempts=5; \
	while true; do \
		refuse_destroys; \
		log="$$(mktemp)"; \
		set +e; \
		$(TF_DOCKER) apply -input=false -lock-timeout=5m -parallelism=$(TF_PARALLELISM) tfplan >"$$log" 2>&1; \
		status=$$?; \
		set -e; \
		cat "$$log"; \
		if [ "$$status" -eq 0 ]; then rm -f "$$log"; exit 0; fi; \
		if grep -q 'API error 429' "$$log" && [ "$$attempt" -lt "$$max_attempts" ]; then \
			wait_s=$$((15 * attempt)); \
			echo "cron-job.org returned 429. Waiting $${wait_s}s, then planning again (attempt $$((attempt + 1))/$${max_attempts})."; \
			rm -f "$$log"; \
			sleep "$$wait_s"; \
			plan_attempt=1; \
			while true; do \
				log="$$(mktemp)"; \
				set +e; \
				$(TF_DOCKER) plan -input=false -lock-timeout=5m -parallelism=$(TF_PARALLELISM) -out=tfplan >"$$log" 2>&1; \
				plan_status=$$?; \
				set -e; \
				cat "$$log"; \
				if [ "$$plan_status" -eq 0 ]; then rm -f "$$log"; break; fi; \
				if grep -q 'API error 429' "$$log" && [ "$$plan_attempt" -lt "$$max_attempts" ]; then \
					wait_s=$$((15 * plan_attempt)); \
					echo "Plan hit 429. Waiting $${wait_s}s (plan attempt $$((plan_attempt + 1))/$${max_attempts})."; \
					rm -f "$$log"; \
					sleep "$$wait_s"; \
					plan_attempt=$$((plan_attempt + 1)); \
					continue; \
				fi; \
				rm -f "$$log"; \
				exit "$$plan_status"; \
			done; \
			attempt=$$((attempt + 1)); \
			continue; \
		fi; \
		rm -f "$$log"; \
		exit "$$status"; \
	done

tf-import:
	@if [ -z "$(ADDR)" ] || [ -z "$(ID)" ]; then \
		echo "Usage: make tf-import ADDR='cronjoborg_job.bot[\"urabot_stocks\"]' ID=<jobId>"; \
		exit 1; \
	fi
	@$(load_tf_env); \
	$(require_r2); \
	$(require_cron); \
	$(TF_DOCKER) import -input=false '$(ADDR)' '$(ID)'

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
