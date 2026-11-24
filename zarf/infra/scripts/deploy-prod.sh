#!/usr/bin/env bash
# Production plan and apply for the cron-job.org jobs.
# Pins Terraform so a new HashiCorp release cannot change what writes state.
# --plan-only installs that pin, inits, plans, and exits before apply.
set -euo pipefail

TF_VERSION=1.17.2

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
INFRA="${ROOT}/zarf/infra"
TF=""

if [ -f "${ROOT}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${ROOT}/.env"
  set +a
fi

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${R2_ACCESS_KEY_ID:-}}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-${R2_SECRET_ACCESS_KEY:-}}"
export TF_VAR_bot_api_key="${TF_VAR_bot_api_key:-${API_KEY:-}}"
export TF_IN_AUTOMATION=1

terraform_version() {
  "$1" version | awk 'NR == 1 { sub(/^Terraform v/, ""); print; exit }'
}

require_single_executable() {
  local path="$1"
  if [ -z "${path}" ] || [ "${path}" != "${path%%$'\n'*}" ]; then
    echo "Terraform path must be a single executable file." >&2
    printf '%s\n' "${path}" >&2
    exit 1
  fi
  if [ ! -f "${path}" ] || [ ! -x "${path}" ]; then
    echo "Terraform path is not an executable file: ${path}" >&2
    exit 1
  fi
}

install_pinned_terraform() {
  local os machine arch dest url
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  machine="$(uname -m)"
  case "${machine}" in
    x86_64) arch="amd64" ;;
    aarch64 | arm64) arch="arm64" ;;
    *)
      echo "Unsupported architecture: ${machine}" >&2
      exit 1
      ;;
  esac
  dest="${TMPDIR:-/tmp}/terraform-${TF_VERSION}-${arch}"
  mkdir -p "${dest}"
  url="https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_${os}_${arch}.zip"
  echo "Installing Terraform ${TF_VERSION} from ${url}" >&2
  curl -fsSL "${url}" -o "${dest}/terraform.zip"
  unzip -q -o "${dest}/terraform.zip" -d "${dest}"
  chmod +x "${dest}/terraform"
  printf '%s\n' "${dest}/terraform"
}

resolve_terraform() {
  if command -v terraform >/dev/null 2>&1 && [ "$(terraform_version terraform)" = "${TF_VERSION}" ]; then
    TF="$(command -v terraform)"
  else
    TF="$(install_pinned_terraform)"
  fi
  require_single_executable "${TF}"
  local got
  got="$(terraform_version "${TF}")"
  if [ "${got}" != "${TF_VERSION}" ]; then
    echo "Terraform ${got} does not match pinned ${TF_VERSION}." >&2
    exit 1
  fi
  echo "Using Terraform ${got}"
}

plan_destroy_count() {
  local summary="$1"
  local destroys
  destroys="$(printf '%s\n' "${summary}" | sed -n 's/.* \([0-9][0-9]*\) to destroy.*/\1/p')"
  printf '%s\n' "${destroys:-0}"
}

write_plan_summary() {
  local summary count
  summary="$("${TF}" show -no-color tfplan | sed -n 's/^Plan: //p')"
  if [ -n "${summary}" ]; then
    echo "Plan: ${summary}"
  fi
  count="$(plan_destroy_count "${summary}")"
  echo "Destroy count: ${count}"
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required to write the plan summary." >&2
    exit 1
  fi
  "${TF}" show -json tfplan | jq -r '.resource_changes[] | "\(.address) \(.change.actions | join(","))"' >"${ROOT}/plan-summary.txt"
}

refuse_destroys() {
  local summary count
  summary="$("${TF}" show -no-color tfplan | sed -n 's/^Plan: //p')"
  if [ -n "${summary}" ]; then
    echo "Plan: ${summary}"
  fi
  count="$(plan_destroy_count "${summary}")"
  if [ "${count}" != "0" ] && [ "${TF_ALLOW_DESTROY:-}" != "1" ]; then
    echo "Refusing apply because the plan destroys ${count} resource(s). Set TF_ALLOW_DESTROY=1 to override." >&2
    exit 1
  fi
}

main() {
  local plan_only=0
  if [ "$#" -gt 1 ]; then
    echo "Usage: deploy-prod.sh [--plan-only]" >&2
    exit 1
  fi
  if [ "${1:-}" = "--plan-only" ]; then
    plan_only=1
  elif [ -n "${1:-}" ]; then
    echo "Unknown argument: $1" >&2
    echo "Usage: deploy-prod.sh [--plan-only]" >&2
    exit 1
  fi

  if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
    echo "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)." >&2
    exit 1
  fi
  if [ -z "${CRON_JOB_API_KEY}" ]; then
    echo "Set CRON_JOB_API_KEY." >&2
    exit 1
  fi
  if [ -z "${TF_VAR_bot_api_key}" ]; then
    echo "Set API_KEY or TF_VAR_bot_api_key." >&2
    exit 1
  fi

  resolve_terraform

  cd "${INFRA}"
  "${TF}" init -input=false -reconfigure
  "${TF}" plan -input=false -lock-timeout=5m -parallelism=1 -out=tfplan

  if [ ! -f tfplan ]; then
    echo "terraform plan did not write tfplan." >&2
    exit 1
  fi

  if [ "${plan_only}" -eq 1 ]; then
    write_plan_summary
    exit 0
  fi

  local attempt=1
  local max_attempts=5
  while true; do
    refuse_destroys
    local log status
    log="$(mktemp)"
    set +e
    "${TF}" apply -input=false -lock-timeout=5m -parallelism=1 tfplan >"${log}" 2>&1
    status=$?
    set -e
    cat "${log}"
    if [ "${status}" -eq 0 ]; then
      rm -f "${log}"
      exit 0
    fi
    if grep -q 'API error 429' "${log}" && [ "${attempt}" -lt "${max_attempts}" ]; then
      local wait_s=$((15 * attempt))
      echo "cron-job.org returned 429. Waiting ${wait_s}s, then planning again (attempt $((attempt + 1))/${max_attempts})."
      rm -f "${log}"
      sleep "${wait_s}"
      local plan_attempt=1 plan_status
      while true; do
        log="$(mktemp)"
        set +e
        "${TF}" plan -input=false -lock-timeout=5m -parallelism=1 -out=tfplan >"${log}" 2>&1
        plan_status=$?
        set -e
        cat "${log}"
        if [ "${plan_status}" -eq 0 ]; then
          rm -f "${log}"
          break
        fi
        if grep -q 'API error 429' "${log}" && [ "${plan_attempt}" -lt "${max_attempts}" ]; then
          wait_s=$((15 * plan_attempt))
          echo "Plan hit 429. Waiting ${wait_s}s (plan attempt $((plan_attempt + 1))/${max_attempts})."
          rm -f "${log}"
          sleep "${wait_s}"
          plan_attempt=$((plan_attempt + 1))
          continue
        fi
        rm -f "${log}"
        exit "${plan_status}"
      done
      attempt=$((attempt + 1))
      continue
    fi
    rm -f "${log}"
    exit "${status}"
  done
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  main "$@"
fi
