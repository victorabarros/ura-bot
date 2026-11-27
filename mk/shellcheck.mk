# Lint the zarf shell scripts. Shellcheck is not part of the Terraform image.

SHELLCHECK_IMAGE ?= koalaman/shellcheck:stable

.PHONY: shellcheck

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
