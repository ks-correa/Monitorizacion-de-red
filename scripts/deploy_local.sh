#!/bin/bash

set -e

echo "Iniciando despliegue local de Uptime Kuma..."

cd "$(dirname "$0")/.."

sudo ansible-playbook -i local/inventory_local.ini local/desplegar_local.yml

echo "Despliegue local finalizado correctamente."
echo "Acceso local: http://localhost:3001"