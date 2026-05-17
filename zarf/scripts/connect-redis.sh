#!/usr/bin/env bash
set -a
source .env
set +a

REDISCLI_AUTH="${REDIS_CLOUD_PASSWORD}" redis-cli \
  -h "${REDIS_CLOUD_HOST}" \
  -p "${REDIS_CLOUD_PORT}" \
  --user "${REDIS_CLOUD_USERNAME}"
