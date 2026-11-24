#!/usr/bin/env bash
# Production plan and apply for the cron-job.org jobs.
# Pins Terraform so a new HashiCorp release cannot change what writes state.
set -euo pipefail

TF_VERSION=1.17.2

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
INFRA="${ROOT}/zarf/infra"

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

if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
  echo "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY)."
  exit 1
fi
if [ -z "${CRON_JOB_API_KEY}" ]; then
  echo "Set CRON_JOB_API_KEY."
  exit 1
fi
if [ -z "${TF_VAR_bot_api_key}" ]; then
  echo "Set API_KEY or TF_VAR_bot_api_key."
  exit 1
fi

terraform_version() {
  "$1" version | awk 'NR == 1 { sub(/^Terraform v/, ""); print; exit }'
}

install_pinned_terraform() {
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  machine="$(uname -m)"
  case "${machine}" in
    x86_64) arch="amd64" ;;
    aarch64 | arm64) arch="arm64" ;;
    *)
      echo "Unsupported architecture: ${machine}"
      exit 1
      ;;
  esac
  dest="${TMPDIR:-/tmp}/terraform-${TF_VERSION}-${arch}"
  mkdir -p "${dest}"
  url="https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_${os}_${arch}.zip"
  echo "Installing Terraform ${TF_VERSION} from ${url}"
  curl -fsSL "${url}" -o "${dest}/terraform.zip"
  unzip -o "${dest}/terraform.zip" -d "${dest}"
  chmod +x "${dest}/terraform"
  printf '%s\n' "${dest}/terraform"
}

if command -v terraform >/dev/null 2>&1 && [ "$(terraform_version terraform)" = "${TF_VERSION}" ]; then
  TF="$(command -v terraform)"
else
  TF="$(install_pinned_terraform)"
fi

got="$(terraform_version "${TF}")"
if [ "${got}" != "${TF_VERSION}" ]; then
  echo "Terraform ${got} does not match pinned ${TF_VERSION}."
  exit 1
fi
echo "Using Terraform ${got}"

cd "${INFRA}"
"${TF}" init -input=false -reconfigure
"${TF}" plan -input=false -lock-timeout=5m -parallelism=1 -out=tfplan

if [ ! -f tfplan ]; then
  echo "terraform plan did not write tfplan."
  exit 1
fi

refuse_destroys() {
  summary="$("${TF}" show -no-color tfplan | sed -n 's/^Plan: //p')"
  if [ -n "${summary}" ]; then
    echo "Plan: ${summary}"
  fi
  destroys="$(printf '%s\n' "${summary}" | sed -n 's/.* \([0-9][0-9]*\) to destroy.*/\1/p')"
  if [ "${destroys:-0}" != "0" ] && [ "${TF_ALLOW_DESTROY:-}" != "1" ]; then
    echo "Refusing apply because the plan destroys ${destroys} resource(s). Set TF_ALLOW_DESTROY=1 to override."
    exit 1
  fi
}

attempt=1
max_attempts=5
while true; do
  refuse_destroys
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
    wait_s=$((15 * attempt))
    echo "cron-job.org returned 429. Waiting ${wait_s}s, then planning again (attempt $((attempt + 1))/${max_attempts})."
    rm -f "${log}"
    sleep "${wait_s}"
    plan_attempt=1
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
