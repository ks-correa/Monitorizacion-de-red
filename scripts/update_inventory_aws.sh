#!/bin/bash

set -e

echo "Actualizando inventory.ini con la IP publica actual de AWS..."

cd "$(dirname "$0")/.."

REGION="us-east-1"
INSTANCE_NAME="monitorizacion-red-uptime-kuma"
KEY_FILE="./monitorizacion-key.pem"

IP_PUBLICA=$(aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].PublicIpAddress" \
  --output text)

if [ "$IP_PUBLICA" = "None" ] || [ -z "$IP_PUBLICA" ]; then
  echo "No se encontro una instancia en estado running con el nombre: $INSTANCE_NAME"
  echo "Verifica que la instancia este encendida."
  exit 1
fi

cat > inventory.ini <<EOF
[aws]
$IP_PUBLICA ansible_user=ubuntu ansible_ssh_private_key_file=$KEY_FILE ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

echo "inventory.ini actualizado correctamente."
echo "IP publica actual: $IP_PUBLICA"
echo "Uptime Kuma: http://$IP_PUBLICA:3001"
echo "Grafana: http://$IP_PUBLICA:3000"
