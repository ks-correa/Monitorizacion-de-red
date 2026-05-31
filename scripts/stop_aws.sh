#!/bin/bash

set -e

echo "Deteniendo instancia AWS del proyecto..."

cd "$(dirname "$0")/.."

source scripts/aws_config.sh

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,stopped,pending,stopping" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "No se encontro una instancia con el nombre: $INSTANCE_NAME"
  exit 1
fi

STATE=$(aws ec2 describe-instances \
  --region "$REGION" \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text)

echo "Instancia encontrada: $INSTANCE_ID"
echo "Estado actual: $STATE"

if [ "$STATE" = "stopped" ]; then
  echo "La instancia ya esta apagada."
  exit 0
fi

if [ "$STATE" = "running" ]; then
  echo "Apagando instancia..."
  aws ec2 stop-instances \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"

  echo "Esperando a que la instancia quede en estado stopped..."
  aws ec2 wait instance-stopped \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"

  echo "Instancia detenida correctamente."
else
  echo "La instancia esta en estado '$STATE'. Espera unos minutos y vuelve a intentarlo."
fi
