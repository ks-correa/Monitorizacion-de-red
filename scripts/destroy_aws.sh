#!/bin/bash

set -e

echo "Eliminando recursos AWS del proyecto Monitorizacion de Red..."

cd "$(dirname "$0")/.."

source scripts/aws_config.sh

INSTANCE_ID=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" != "None" ]; then
  echo "Terminando instancia: $INSTANCE_ID"
  aws ec2 terminate-instances \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"

  echo "Esperando a que la instancia termine..."
  aws ec2 wait instance-terminated \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID"
else
  echo "No se encontro instancia activa para eliminar."
fi

SG_ID=$(aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" \
  --query "SecurityGroups[0].GroupId" \
  --output text)

if [ "$SG_ID" != "None" ]; then
  echo "Eliminando Security Group: $SG_ID"
  aws ec2 delete-security-group \
    --region "$REGION" \
    --group-id "$SG_ID"
else
  echo "No se encontro Security Group para eliminar."
fi

echo "Recursos AWS eliminados correctamente."
