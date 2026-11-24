#!/bin/sh
# Sourced by the CI scripts in this directory. Do not call this from Make.
# Make is the laptop path and runs Terraform in Docker. See AGENTS.md.
# Terraform is already on PATH in the pinned job image. This file does not download it.

TF_VERSION=1.17.2
TF=""

load_ci_env() {
  root=$1
  if [ -f "${root}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    . "${root}/.env"
    set +a
  fi
  export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${R2_ACCESS_KEY_ID:-}}"
  export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-${R2_SECRET_ACCESS_KEY:-}}"
  export TF_VAR_bot_api_key="${TF_VAR_bot_api_key:-${API_KEY:-}}"
  export TF_IN_AUTOMATION=1
}

require_tf_secrets() {
  if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
    echo "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)." >&2
    exit 1
  fi
  if [ -z "${CRON_JOB_API_KEY:-}" ]; then
    echo "Set CRON_JOB_API_KEY." >&2
    exit 1
  fi
  if [ -z "${TF_VAR_bot_api_key:-}" ]; then
    echo "Set API_KEY or TF_VAR_bot_api_key." >&2
    exit 1
  fi
}

terraform_version() {
  "$1" version | awk 'NR == 1 { sub(/^Terraform v/, ""); print; exit }'
}

resolve_terraform() {
  if ! command -v terraform >/dev/null 2>&1; then
    echo "Terraform ${TF_VERSION} is not on PATH. This script does not download it." >&2
    exit 1
  fi
  TF=$(command -v terraform)
  case "${TF}" in
    *"
"*)
      echo "Terraform path must be a single executable file." >&2
      printf '%s\n' "${TF}" >&2
      exit 1
      ;;
  esac
  if [ ! -f "${TF}" ] || [ ! -x "${TF}" ]; then
    echo "Terraform path is not an executable file: ${TF}" >&2
    exit 1
  fi
  got=$(terraform_version "${TF}")
  if [ "${got}" != "${TF_VERSION}" ]; then
    echo "Terraform ${got} does not match pinned ${TF_VERSION}." >&2
    exit 1
  fi
  echo "Using Terraform ${got}" >&2
}
