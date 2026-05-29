#!/bin/bash

set -e

echo "Iniciando despliegue completo en AWS..."

cd "$(dirname "$0")/.."

echo "Fase 1: Creando infraestructura AWS..."
ansible-playbook cloud/iac_aws.yml

echo "Fase 2: Desplegando Uptime Kuma en la instancia EC2..."
ansible-playbook -i inventory.ini cloud/desplegar_kuma_aws.yml

echo "Despliegue AWS finalizado correctamente."
echo "Revisa la IP publica generada en inventory.ini"
echo "Acceso esperado: http://IP_PUBLICA:3001"