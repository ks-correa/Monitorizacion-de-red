#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Construyendo y levantando GastoSmart local..."
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build

echo "Validando servicios locales..."
apps/gastosmart/scripts/validar_local.sh

echo "GastoSmart local disponible en http://localhost:8080"
