#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-1}"
KEY_FILE="${KEY_FILE:-/home/kevin/Desktop/Monitorizacion-de-red/monitorizacion-key.pem}"
USER_NAME="${ANSIBLE_USER_AWS:-ubuntu}"
OUT="inventories/gastosmart_aws.ini"

MONITOR_NAME="${MONITOR_NAME:-gastosmart-monitorizacion}"
FRONTEND_NAME="${FRONTEND_NAME:-gastosmart-frontend}"
BACKEND_NAME="${BACKEND_NAME:-gastosmart-backend}"
MONGODB_NAME="${MONGODB_NAME:-gastosmart-mongodb}"

query_instance() {
  local name="$1"
  aws ec2 describe-instances \
    --region "$REGION" \
    --filters "Name=tag:Name,Values=$name" "Name=tag:Aplicacion,Values=GastoSmart" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query "Reservations[0].Instances[0].$2" \
    --output text
}

MONITOR_PUBLIC_IP="$(query_instance "$MONITOR_NAME" PublicIpAddress)"
FRONTEND_PUBLIC_IP="$(query_instance "$FRONTEND_NAME" PublicIpAddress)"
BACKEND_PRIVATE_IP="$(query_instance "$BACKEND_NAME" PrivateIpAddress)"
MONGODB_PRIVATE_IP="$(query_instance "$MONGODB_NAME" PrivateIpAddress)"

if [ "$MONITOR_PUBLIC_IP" = "None" ] || [ "$FRONTEND_PUBLIC_IP" = "None" ] || [ "$BACKEND_PRIVATE_IP" = "None" ] || [ "$MONGODB_PRIVATE_IP" = "None" ]; then
  echo "No se pudieron resolver todas las IPs necesarias. Verifica las instancias en AWS."
  exit 1
fi

mkdir -p inventories
cat > "$OUT" <<EOF
[monitorizacion]
monitor ansible_host=$MONITOR_PUBLIC_IP ansible_user=$USER_NAME ansible_ssh_private_key_file=$KEY_FILE

[frontend]
frontend ansible_host=$FRONTEND_PUBLIC_IP ansible_user=$USER_NAME ansible_ssh_private_key_file=$KEY_FILE

[backend]
backend ansible_host=$BACKEND_PRIVATE_IP ansible_user=$USER_NAME ansible_ssh_private_key_file=$KEY_FILE ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new -o ProxyCommand="ssh -i $KEY_FILE -o StrictHostKeyChecking=accept-new -W %h:%p $USER_NAME@$FRONTEND_PUBLIC_IP"'

[mongodb]
mongodb ansible_host=$MONGODB_PRIVATE_IP ansible_user=$USER_NAME ansible_ssh_private_key_file=$KEY_FILE ansible_ssh_common_args='-o StrictHostKeyChecking=accept-new -o ProxyCommand="ssh -i $KEY_FILE -o StrictHostKeyChecking=accept-new -W %h:%p $USER_NAME@$FRONTEND_PUBLIC_IP"'

[gastosmart:children]
monitorizacion
frontend
backend
mongodb
EOF

echo "Inventario actualizado en $OUT"
echo "Frontend: http://$FRONTEND_PUBLIC_IP"
