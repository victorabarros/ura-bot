APP_NAME=ura-bot
PORT?=8082
# Static landing page. Override with `make site SITE_PORT=9090`.
SITE_PORT?=8080
NGINX_IMAGE:=nginx:1.27.5-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10


YELLOW=$(shell printf '\033[0;1;33m')
COLOR_OFF=$(shell printf '\033[0;1;0m')

.PHONY: welcome \
        build run dev test docker-test lint typecheck \
        purge-containers purge-images \
        site \
        tf-init tf-fmt tf-validate tf-plan tf-plan-summary tf-apply \
        site-tf-init site-tf-fmt site-tf-validate site-tf-plan site-tf-apply \
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

# Serves web/ through nginx in Docker. Nothing to install on the host.
# http://localhost:$(SITE_PORT) — default 8080. Stop with Ctrl-C.
site:
	@docker run --rm \
		--name $(APP_NAME)-site \
		-p $(SITE_PORT):80 \
		-v $(CURDIR)/web:/usr/share/nginx/html:ro \
		$(NGINX_IMAGE)

purge-images:
	@images=$$(docker images -q "$(APP_NAME)"); \
	if [ -n "$$images" ]; then \
		echo "Removing images: $$images"; \
		docker rmi -f $$images; \
	else \
		echo "No images found for $(APP_NAME)."; \
	fi

# ── Terraform (cron-job.org, state in Cloudflare R2) ────────────────────
# Laptop only. These targets run Terraform in Docker. CI must not call them.
# CI uses zarf/infra/scripts. See AGENTS.md.
# Official image, pinned. Mount only zarf/infra. Credentials come from the
# environment or a gitignored .env. They are not written into the image.

TF_IMAGE := hashicorp/terraform:1.17.2@sha256:6e9c1e647c31a960dc9b59e13272f9111d90010c10b717f77ffb324767660475
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
		zarf/infra/scripts/common.sh \
		zarf/infra/scripts/fmt-validate.sh \
		zarf/infra/scripts/plan.sh \
		zarf/infra/scripts/apply.sh \
		zarf/site/scripts/common.sh \
		zarf/site/scripts/fmt-validate.sh \
		zarf/site/scripts/plan.sh \
		zarf/site/scripts/apply.sh

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
	set -o pipefail; \
	$(require_r2); \
	$(require_cron); \
	deletes="$$(docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-v $(CURDIR)/zarf/infra:/workspace \
		-w /workspace \
		--entrypoint sh \
		$(TF_IMAGE) \
		-c 'terraform show -json tfplan | awk "{ print gsub(/\"actions\":\\[[^]]*delete/, \"&\") }"')"; \
	if [ "$${deletes:-0}" != "0" ] && [ "$${TF_ALLOW_DESTROY:-}" != "1" ]; then \
		echo "Refusing apply because the plan deletes $${deletes} resource(s). Set TF_ALLOW_DESTROY=1 to override."; \
		exit 1; \
	fi; \
	$(TF_DOCKER) apply -input=false -lock-timeout=5m -parallelism=$(TF_PARALLELISM) tfplan

# ── Terraform (static site) ─────────────────────────────────────────────
# Laptop only. These targets run Terraform in Docker. CI must not call them.
# CI uses zarf/site/scripts. State is a separate R2 object from the cron stack.
# Credentials are written to a temporary file with profiles r2 and site.
# They are not passed on the Docker command line.

load_site_env = \
	set -eu; \
	if [ -f .env ]; then set -a; . ./.env; set +a; fi

require_site = \
	r2_key="$${R2_ACCESS_KEY_ID:-$${AWS_ACCESS_KEY_ID:-}}"; \
	r2_secret="$${R2_SECRET_ACCESS_KEY:-$${AWS_SECRET_ACCESS_KEY:-}}"; \
	if [ -z "$$r2_key" ] || [ -z "$$r2_secret" ]; then \
		echo "Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) for Terraform state."; \
		exit 1; \
	fi; \
	if [ -z "$${SITE_AWS_ACCESS_KEY_ID:-}" ] || [ -z "$${SITE_AWS_SECRET_ACCESS_KEY:-}" ]; then \
		echo "Set SITE_AWS_ACCESS_KEY_ID and SITE_AWS_SECRET_ACCESS_KEY."; \
		exit 1; \
	fi; \
	if [ -z "$${GODADDY_API_KEY:-}" ] || [ -z "$${GODADDY_API_SECRET:-}" ]; then \
		echo "Set GODADDY_API_KEY and GODADDY_API_SECRET."; \
		exit 1; \
	fi; \
	site_aws_dir=$$(mktemp -d); \
	trap 'rm -rf "$$site_aws_dir"' EXIT; \
	umask 077; \
	printf '%s\n' \
		'[r2]' \
		"aws_access_key_id = $$r2_key" \
		"aws_secret_access_key = $$r2_secret" \
		'' \
		'[site]' \
		"aws_access_key_id = $$SITE_AWS_ACCESS_KEY_ID" \
		"aws_secret_access_key = $$SITE_AWS_SECRET_ACCESS_KEY" \
		> "$$site_aws_dir/credentials"

site-tf-fmt:
	@docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-v $(CURDIR)/zarf/site:/workspace \
		-w /workspace \
		$(TF_IMAGE) \
		fmt -recursive $(if $(CHECK),-check -diff,)

site-tf-validate:
	@docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e TF_DATA_DIR=/tmp/tfdata \
		-v $(CURDIR)/zarf/site:/workspace \
		-w /workspace \
		--entrypoint sh \
		$(TF_IMAGE) \
		-c 'terraform init -backend=false -input=false && terraform validate'

site-tf-init:
	@$(load_site_env); \
	$(require_site); \
	docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e AWS_SHARED_CREDENTIALS_FILE=/tmp/aws/credentials \
		-e GODADDY_API_KEY \
		-e GODADDY_API_SECRET \
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		init -input=false -reconfigure

site-tf-plan:
	@$(load_site_env); \
	$(require_site); \
	docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e AWS_SHARED_CREDENTIALS_FILE=/tmp/aws/credentials \
		-e GODADDY_API_KEY \
		-e GODADDY_API_SECRET \
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		init -input=false -reconfigure; \
	docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e AWS_SHARED_CREDENTIALS_FILE=/tmp/aws/credentials \
		-e GODADDY_API_KEY \
		-e GODADDY_API_SECRET \
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		plan -input=false -lock-timeout=5m -out=tfplan

site-tf-apply:
	@if [ ! -f zarf/site/tfplan ]; then echo "Run make site-tf-plan first."; exit 1; fi
	@$(load_site_env); \
	set -o pipefail; \
	$(require_site); \
	deletes="$$(docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-v $(CURDIR)/zarf/site:/workspace \
		-w /workspace \
		--entrypoint sh \
		$(TF_IMAGE) \
		-c 'terraform show -json tfplan | awk "{ print gsub(/\"actions\":\\[[^]]*delete/, \"&\") }"')"; \
	if [ "$${deletes:-0}" != "0" ] && [ "$${TF_ALLOW_DESTROY:-}" != "1" ]; then \
		echo "Refusing apply because the plan deletes $${deletes} resource(s). Set TF_ALLOW_DESTROY=1 to override."; \
		exit 1; \
	fi; \
	docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e AWS_SHARED_CREDENTIALS_FILE=/tmp/aws/credentials \
		-e GODADDY_API_KEY \
		-e GODADDY_API_SECRET \
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		apply -input=false -lock-timeout=5m tfplan

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
