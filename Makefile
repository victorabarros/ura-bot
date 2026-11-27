# UraBot engineer-machine tasks.
# CI must not call Make. Terraform CI uses zarf/infra/scripts and zarf/site/scripts.
#
# Target definitions are grouped by concern:
#   mk/app.mk              image, run, dev, test, lint, typecheck
#   mk/site.mk             static landing page
#   mk/terraform.mk        cron-job.org stack (zarf/infra)
#   mk/site-terraform.mk   static site stack (zarf/site)
#   mk/shellcheck.mk       zarf shell scripts
#   mk/git.mk              local git helpers

.DEFAULT_GOAL := welcome

include mk/app.mk
include mk/site.mk
include mk/terraform.mk
include mk/site-terraform.mk
include mk/shellcheck.mk
include mk/git.mk
