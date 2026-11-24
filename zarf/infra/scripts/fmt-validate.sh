#!/usr/bin/env bash
# CI only. GitHub Actions calls this script with bash. Do not call it from Make.
# Ubuntu /bin/sh is dash and does not implement pipefail. See AGENTS.md.
set -eu
set -o pipefail

ROOT=$(CDPATH='' cd -- "$(dirname "$0")/../../.." && pwd)
# shellcheck disable=SC1091
. "${ROOT}/zarf/infra/scripts/common.sh"

resolve_terraform

cd "${ROOT}/zarf/infra"
export TF_IN_AUTOMATION=1
export TF_DATA_DIR="${TMPDIR:-/tmp}/tfdata-fmt"
mkdir -p "${TF_DATA_DIR}"

"${TF}" fmt -recursive -check -diff
"${TF}" init -backend=false -input=false
"${TF}" validate
