#!/bin/sh
# CI only. GitHub Actions calls this script. Do not call it from Make.
# See AGENTS.md.
set -eu
# shellcheck disable=SC3040
set -o pipefail

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
INFRA="${ROOT}/zarf/infra"
SUMMARY="${ROOT}/plan-summary.txt"
# shellcheck disable=SC1091
. "${ROOT}/zarf/infra/scripts/common.sh"

load_ci_env "${ROOT}"
require_tf_secrets
resolve_terraform

cd "${INFRA}"
"${TF}" init -input=false -reconfigure
"${TF}" plan -input=false -lock-timeout=5m -parallelism=1 -out=tfplan

if [ ! -f tfplan ]; then
  echo "terraform plan did not write tfplan." >&2
  exit 1
fi

"${TF}" show -json tfplan | awk -f "${ROOT}/zarf/infra/scripts/plan-actions.awk" > "${SUMMARY}"
if [ ! -s "${SUMMARY}" ]; then
  printf '%s\n' "No changes." > "${SUMMARY}"
fi
echo "Plan summary:" >&2
cat "${SUMMARY}" >&2
