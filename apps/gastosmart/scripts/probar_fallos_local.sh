#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f apps/gastosmart/docker-compose.local.yml"

cd "$(dirname "$0")/../../.."

echo "Prueba 1: caida del backend"
$COMPOSE stop gastosmart-backend
curl -sS http://localhost:8080/api/health || true
echo
$COMPOSE start gastosmart-backend
sleep 8
curl -sS http://localhost:8080/api/health
echo

echo "Prueba 2: caida de MongoDB"
$COMPOSE stop gastosmart-mongodb
sleep 5
curl -sS http://localhost:8000/health
echo
curl -sS http://localhost:8000/db-health
echo
$COMPOSE start gastosmart-mongodb
sleep 12
curl -sS http://localhost:8000/db-health
echo

echo "Prueba 3: caida del frontend"
$COMPOSE stop gastosmart-frontend
curl -sS http://localhost:8080 || true
echo
$COMPOSE start gastosmart-frontend
sleep 8
curl -fsS http://localhost:8080 >/dev/null
echo "Frontend recuperado."
