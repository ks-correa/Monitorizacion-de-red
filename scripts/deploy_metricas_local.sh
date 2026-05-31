#!/bin/bash

set -e

echo "Iniciando despliegue local del modulo de metricas..."

cd "$(dirname "$0")/.."

sudo ansible-playbook -i local/inventory_local.ini local/desplegar_metricas_local.yml

echo "Despliegue local de metricas finalizado correctamente."
echo "Grafana: http://localhost:3000"
echo "Prometheus: http://localhost:9090"
echo "Node Exporter: http://localhost:9100/metrics"
