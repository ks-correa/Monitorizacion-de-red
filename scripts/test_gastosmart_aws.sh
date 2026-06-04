#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

REGION="${AWS_REGION:-us-east-1}"
INVENTORY="${INVENTORY:-inventories/gastosmart_aws.ini}"

FRONTEND_PUBLIC_IP="$(awk '/^frontend / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' "$INVENTORY")"
BACKEND_PRIVATE_IP="$(awk '/^backend / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' "$INVENTORY")"
MONGODB_PRIVATE_IP="$(awk '/^mongodb / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' "$INVENTORY")"

echo "Validando frontend publico..."
curl -fsS "http://$FRONTEND_PUBLIC_IP" >/dev/null
curl -fsS "http://$FRONTEND_PUBLIC_IP/api/health"
echo
curl -fsS "http://$FRONTEND_PUBLIC_IP/api/db-health"
echo

echo "Validando backend y DB privados desde instancia frontend..."
ansible -i "$INVENTORY" frontend -m shell -a "curl -fsS http://$BACKEND_PRIVATE_IP:8000/health && echo && curl -fsS http://$BACKEND_PRIVATE_IP:8000/db-health"

echo "Validando Uptime Kuma y Grafana en instancia de monitorizacion existente..."
MONITOR_PUBLIC_IP="$(awk '/^monitor / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' "$INVENTORY")"
curl -sS -o /dev/null -w "Uptime Kuma HTTP %{http_code}\n" "http://$MONITOR_PUBLIC_IP:3001"
curl -sS -o /dev/null -w "Grafana HTTP %{http_code}\n" "http://$MONITOR_PUBLIC_IP:3000"

echo "Validando que backend no tenga IP publica..."
aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=gastosmart-backend" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table

echo "Validando que MongoDB no tenga IP publica..."
aws ec2 describe-instances \
  --region "$REGION" \
  --filters "Name=tag:Name,Values=gastosmart-mongodb" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table

echo "Revisando Security Groups esperados..."
aws ec2 describe-security-groups \
  --region "$REGION" \
  --filters "Name=group-name,Values=monitorizacion-sg,frontend-sg,backend-sg,mongodb-sg" \
  --query "SecurityGroups[*].{Nombre:GroupName,Reglas:IpPermissions}" \
  --output json

echo "Pruebas AWS completadas. MongoDB privado esperado en $MONGODB_PRIVATE_IP:27017 solo desde backend-sg."
