#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-1}"

echo "Terminando instancias EC2 de GastoSmart..."
INSTANCE_IDS="$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Aplicacion,Values=GastoSmart" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text)"

if [ -n "$INSTANCE_IDS" ] && [ "$INSTANCE_IDS" != "None" ]; then
  aws ec2 terminate-instances --region "$REGION" --instance-ids $INSTANCE_IDS
  aws ec2 wait instance-terminated --region "$REGION" --instance-ids $INSTANCE_IDS
else
  echo "No se encontraron instancias activas de GastoSmart."
fi

echo "Eliminando Security Groups de GastoSmart..."
for SG_NAME in mongodb-sg backend-sg frontend-sg monitorizacion-sg; do
  SG_ID="$(aws ec2 describe-security-groups \
    --region "$REGION" \
    --filters "Name=group-name,Values=$SG_NAME" \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || true)"

  if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
    aws ec2 delete-security-group --region "$REGION" --group-id "$SG_ID" || true
    echo "Security Group eliminado o en proceso: $SG_NAME"
  fi
done

echo "Destruccion basica completada."
echo "Si creaste VPC/subredes/NAT dedicados, revisa y elimina recursos de red asociados si ya no los necesitas."
