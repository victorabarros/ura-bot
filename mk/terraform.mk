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

.PHONY: tf-init tf-fmt tf-validate tf-plan tf-plan-summary tf-apply

tf-init:
	@$(load_tf_env); \
	$(require_r2); \
	$(TF_DOCKER) init -input=false -reconfigure

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
