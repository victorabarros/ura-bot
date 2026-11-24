#!/usr/bin/env bash
# CI only. GitHub Actions calls this script with bash. Do not call it from Make.
# Ubuntu /bin/sh is dash and does not implement pipefail. See AGENTS.md.
set -eu
set -o pipefail

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
INFRA="${ROOT}/zarf/site"
SUMMARY="${ROOT}/site-plan-summary.txt"
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

"${TF}" show -json tfplan | jq -r '.resource_changes[]? | "\(.address) \(.change.actions | join(","))"' > "${SUMMARY}"
if [ ! -s "${SUMMARY}" ]; then
  printf '%s\n' "No changes." > "${SUMMARY}"
fi
echo "Plan summary:" >&2
cat "${SUMMARY}" >&2
