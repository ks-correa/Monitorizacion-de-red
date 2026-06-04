#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

INVENTORY="inventories/gastosmart_aws.ini"

echo "Fase 1: creando infraestructura segura en AWS..."
ansible-playbook cloud/iac_gastosmart_secure.yml

echo "Fase 2: desplegando MongoDB privado..."
ansible-playbook -i "$INVENTORY" cloud/desplegar_gastosmart_mongodb.yml

echo "Fase 3: desplegando backend privado..."
ansible-playbook -i "$INVENTORY" cloud/desplegar_gastosmart_backend.yml

echo "Fase 4: desplegando frontend publico con reverse proxy..."
ansible-playbook -i "$INVENTORY" cloud/desplegar_gastosmart_frontend.yml

echo "Fase 5: preparando especificacion de monitores..."
ansible-playbook -i "$INVENTORY" cloud/configurar_monitores_gastosmart.yml

echo "Despliegue AWS de GastoSmart finalizado."
echo "Inventario: $INVENTORY"
