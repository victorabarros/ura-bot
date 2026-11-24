#!/bin/sh
# CI only. GitHub Actions calls this script. Do not call it from Make.
# See AGENTS.md.
set -eu
# shellcheck disable=SC3040
set -o pipefail

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
INFRA="${ROOT}/zarf/infra"
# shellcheck disable=SC1091
. "${ROOT}/zarf/infra/scripts/common.sh"

load_ci_env "${ROOT}"
require_tf_secrets
require_jq
resolve_terraform

cd "${INFRA}"
"${TF}" init -input=false -reconfigure
"${TF}" plan -input=false -lock-timeout=5m -parallelism=1 -out=tfplan

if [ ! -f tfplan ]; then
  echo "terraform plan did not write tfplan." >&2
  exit 1
fi

# Count resource changes whose actions include delete, including replace.
deletes=$("${TF}" show -json tfplan | jq '[.resource_changes[]? | select(.change.actions | index("delete"))] | length')
if [ "${deletes}" != "0" ] && [ "${TF_ALLOW_DESTROY:-}" != "1" ]; then
  echo "Refusing apply because the plan deletes ${deletes} resource(s). Set TF_ALLOW_DESTROY=1 to override." >&2
  exit 1
fi

# cron-job.org allows 1 create per second and 5 per minute.
"${TF}" apply -input=false -lock-timeout=5m -parallelism=1 tfplan
