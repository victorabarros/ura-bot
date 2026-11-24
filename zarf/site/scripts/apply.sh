#!/usr/bin/env bash
# CI only. GitHub Actions calls this script with bash. Do not call it from Make.
# Ubuntu /bin/sh is dash and does not implement pipefail. See AGENTS.md.
set -eu
set -o pipefail

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
INFRA="${ROOT}/zarf/site"
# shellcheck disable=SC1091
. "${ROOT}/zarf/site/scripts/common.sh"

load_ci_env "${ROOT}"
require_site_secrets
require_jq
resolve_terraform
write_aws_credentials

cd "${INFRA}"
"${TF}" init -input=false -reconfigure
"${TF}" plan -input=false -lock-timeout=5m -out=tfplan

if [ ! -f tfplan ]; then
  echo "terraform plan did not write tfplan." >&2
  exit 1
fi

deletes=$("${TF}" show -json tfplan | jq '[.resource_changes[]? | select(.change.actions | index("delete"))] | length')
if [ "${deletes}" != "0" ] && [ "${TF_ALLOW_DESTROY:-}" != "1" ]; then
  echo "Refusing apply because the plan deletes ${deletes} resource(s). Set TF_ALLOW_DESTROY=1 to override." >&2
  exit 1
fi

"${TF}" apply -input=false -lock-timeout=5m tfplan
