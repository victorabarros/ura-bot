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

.PHONY: site-tf-init site-tf-fmt site-tf-validate site-tf-plan site-tf-apply

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
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		init -input=false -reconfigure; \
	docker run --rm --platform $(TF_PLATFORM) \
		--user $(shell id -u):$(shell id -g) \
		-e TF_IN_AUTOMATION=1 \
		-e AWS_SHARED_CREDENTIALS_FILE=/tmp/aws/credentials \
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
		-v $(CURDIR)/zarf/site:/workspace \
		-v $$site_aws_dir:/tmp/aws:ro \
		-w /workspace \
		$(TF_IMAGE) \
		apply -input=false -lock-timeout=5m tfplan
