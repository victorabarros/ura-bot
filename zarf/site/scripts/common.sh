#!/bin/sh
# Sourced by the CI scripts in this directory. Do not call this from Make.
# Make is the laptop path and runs Terraform in Docker. See AGENTS.md.
# Terraform 1.17.2 is already on PATH. The workflow installs it. This file does not download it.

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
  export TF_IN_AUTOMATION=1
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required." >&2
    exit 1
  fi
}

require_site_secrets() {
  r2_key=${R2_ACCESS_KEY_ID:-${AWS_ACCESS_KEY_ID:-}}
  r2_secret=${R2_SECRET_ACCESS_KEY:-${AWS_SECRET_ACCESS_KEY:-}}
  if [ -z "${r2_key}" ] || [ -z "${r2_secret}" ]; then
    echo "Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY (or AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) for Terraform state." >&2
    exit 1
  fi
  if [ -z "${SITE_AWS_ACCESS_KEY_ID:-}" ] || [ -z "${SITE_AWS_SECRET_ACCESS_KEY:-}" ]; then
    echo "Set SITE_AWS_ACCESS_KEY_ID and SITE_AWS_SECRET_ACCESS_KEY." >&2
    exit 1
  fi
}

# Writes profiles r2 and site, then drops AWS_* so Terraform uses the file.
# Call only after require_site_secrets. Never writes an empty key.
write_aws_credentials() {
  r2_key=${R2_ACCESS_KEY_ID:-${AWS_ACCESS_KEY_ID:-}}
  r2_secret=${R2_SECRET_ACCESS_KEY:-${AWS_SECRET_ACCESS_KEY:-}}
  cred_dir=$(mktemp -d)
  cred_file="${cred_dir}/credentials"
  umask 077
  printf '%s\n' \
    '[r2]' \
    "aws_access_key_id = ${r2_key}" \
    "aws_secret_access_key = ${r2_secret}" \
    '' \
    '[site]' \
    "aws_access_key_id = ${SITE_AWS_ACCESS_KEY_ID}" \
    "aws_secret_access_key = ${SITE_AWS_SECRET_ACCESS_KEY}" \
    > "${cred_file}"
  export AWS_SHARED_CREDENTIALS_FILE="${cred_file}"
  export SITE_AWS_CREDENTIALS_DIR="${cred_dir}"
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE
  trap 'rm -rf "${SITE_AWS_CREDENTIALS_DIR}"' EXIT
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
