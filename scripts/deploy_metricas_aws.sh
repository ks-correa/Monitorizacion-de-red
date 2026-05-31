#!/bin/bash

set -e

echo "Iniciando despliegue del modulo de metricas en AWS..."

cd "$(dirname "$0")/.."

ansible-playbook -i inventory.ini cloud/desplegar_metricas_aws.yml

IP_PUBLICA=$(awk '/^[0-9]/{print $1}' inventory.ini)

echo "Despliegue de metricas en AWS finalizado correctamente."
echo "Grafana: http://${IP_PUBLICA}:3000"
echo "Prometheus: disponible internamente en el puerto 9090"
echo "Node Exporter: disponible internamente en el puerto 9100"
echo "Revisa la IP publica actual en inventory.ini"