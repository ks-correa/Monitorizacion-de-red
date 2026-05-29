#!/bin/bash

set -e

echo "Eliminando recursos AWS del proyecto Monitorizacion de Red..."

INSTANCE_ID=$(aws ec2 describe-instances \
  --region us-east-1 \
  --filters "Name=tag:Name,Values=monitorizacion-red-uptime-kuma" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" != "None" ]; then
  echo "Terminando instancia: $INSTANCE_ID"
  aws ec2 terminate-instances \
    --region us-east-1 \
    --instance-ids "$INSTANCE_ID"

  echo "Esperando a que la instancia termine..."
  aws ec2 wait instance-terminated \
    --region us-east-1 \
    --instance-ids "$INSTANCE_ID"
else
  echo "No se encontro instancia activa para eliminar."
fi

SG_ID=$(aws ec2 describe-security-groups \
  --region us-east-1 \
  --filters "Name=group-name,Values=monitorizacion-red-sg" \
  --query "SecurityGroups[0].GroupId" \
  --output text)

if [ "$SG_ID" != "None" ]; then
  echo "Eliminando Security Group: $SG_ID"
  aws ec2 delete-security-group \
    --region us-east-1 \
    --group-id "$SG_ID"
else
  echo "No se encontro Security Group para eliminar."
fi

echo "Recursos AWS eliminados correctamente."
