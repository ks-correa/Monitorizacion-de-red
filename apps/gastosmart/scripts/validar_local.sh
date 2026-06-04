#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../../.."

echo "Validando contenedores de GastoSmart local..."
docker compose -f apps/gastosmart/docker-compose.local.yml ps

retry_curl() {
  local url="$1"
  local attempts="${2:-20}"
  local delay="${3:-2}"

  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url"; then
      return 0
    fi
    sleep "$delay"
  done

  echo "No se pudo validar $url" >&2
  return 1
}

echo
echo "Validando frontend..."
retry_curl http://localhost:8080 >/dev/null

echo "Validando backend via proxy..."
retry_curl http://localhost:8080/api/health
echo
retry_curl http://localhost:8080/api/db-health
echo

echo "Validando backend directo local..."
retry_curl http://localhost:8000/health
echo
retry_curl http://localhost:8000/db-health
echo

echo "Validacion local completada."
