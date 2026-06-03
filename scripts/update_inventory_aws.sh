#!/bin/bash

set -e

echo "Actualizando inventory.ini con la IP publica actual de AWS..."

cd "$(dirname "$0")/.."

source scripts/aws_config.sh

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

KNOWN_HOSTS_FILE="${KNOWN_HOSTS_FILE:-$HOME/.ssh/known_hosts}"
mkdir -p "$(dirname "$KNOWN_HOSTS_FILE")"
chmod 700 "$(dirname "$KNOWN_HOSTS_FILE")"
ssh-keygen -R "$IP_PUBLICA" -f "$KNOWN_HOSTS_FILE" >/dev/null 2>&1 || true
ssh-keyscan -H "$IP_PUBLICA" >> "$KNOWN_HOSTS_FILE" 2>/dev/null

cat > inventory.ini <<EOF
[aws]
$IP_PUBLICA ansible_user=ubuntu ansible_ssh_private_key_file=$KEY_FILE
EOF

echo "inventory.ini actualizado correctamente."
echo "Huella SSH registrada en $KNOWN_HOSTS_FILE"
echo "IP publica actual: $IP_PUBLICA"
echo "Uptime Kuma: http://$IP_PUBLICA:3001"
echo "Grafana: http://$IP_PUBLICA:3000"
