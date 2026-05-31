#!/bin/bash

set -e

echo "Iniciando instancia AWS del proyecto..."

cd "$(dirname "$0")/.."

source scripts/aws_config.sh

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=stopped,running,pending,stopping" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "No se encontro una instancia con el nombre: $INSTANCE_NAME"
  echo "Primero debes crear la infraestructura con:"
  echo "ansible-playbook cloud/iac_aws.yml"
  exit 1
fi

STATE=$(aws ec2 describe-instances \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text)

echo "Instancia encontrada: $INSTANCE_ID"
echo "Estado actual: $STATE"

if [ "$STATE" = "running" ]; then
  echo "La instancia ya esta encendida."
elif [ "$STATE" = "stopped" ]; then
  echo "Encendiendo instancia..."
  aws ec2 start-instances \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"

  echo "Esperando a que la instancia quede en estado running..."
  aws ec2 wait instance-running \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"
else
  echo "La instancia esta en estado '$STATE'. Esperando a que quede running..."
  aws ec2 wait instance-running \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"
fi

echo "Actualizando reglas del Security Group con la IP publica actual del administrador..."
./scripts/update_security_aws.sh

echo "Actualizando inventory.ini con la IP publica actual..."
./scripts/update_inventory_aws.sh

echo "Instancia AWS lista para usar."
