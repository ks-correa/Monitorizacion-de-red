# Evidencias GastoSmart

## Objetivo

Este documento reúne comandos útiles para obtener evidencias del funcionamiento local, despliegue AWS, seguridad y monitorización de GastoSmart.

## Evidencias locales

Levantar el entorno:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Validar servicios:

```bash
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
curl http://localhost:8000/health
curl http://localhost:8000/db-health
curl http://localhost:8080/api/test
docker ps
```

Detener el entorno:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml down
```

## Evidencias AWS

Desplegar o actualizar GastoSmart:

```bash
./scripts/deploy_gastosmart_aws.sh
```

Actualizar inventario:

```bash
./scripts/update_inventory_gastosmart.sh
```

Probar el despliegue:

```bash
./scripts/test_gastosmart_aws.sh
```

## Validar que backend y MongoDB son privados

Backend:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=gastosmart-backend" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table
```

MongoDB:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=gastosmart-mongodb" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table
```

Resultado esperado: `PublicIP` debe aparecer vacío o como `None`.

## Validar Security Groups

```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=monitorizacion-sg,frontend-sg,backend-sg,mongodb-sg" \
  --query "SecurityGroups[*].{Nombre:GroupName,Reglas:IpPermissions}" \
  --output json
```

Revisar que:

- `backend-sg` no permita entrada desde `0.0.0.0/0`.
- `mongodb-sg` no permita entrada desde `0.0.0.0/0`.
- `monitorizacion-sg` limite SSH, Grafana y Uptime Kuma a `admin_cidr`.
- Prometheus `9090` no esté abierto públicamente.
- Node Exporter `9100` no esté abierto públicamente a `0.0.0.0/0`.

## Evidencias de monitorización

Capturas recomendadas:

- Uptime Kuma con `GastoSmart Frontend` en UP.
- Uptime Kuma con `GastoSmart Backend Health` en UP.
- Uptime Kuma con `GastoSmart DB Health` en UP.
- Grafana con dashboard `GastoSmart - Monitoreo Distribuido`.
- Prometheus mostrando probes de Blackbox Exporter.
- Pruebas de caída y recuperación.

## Sección para el informe

Para fortalecer el uso real de la solución de monitorización, se integró la aplicación GastoSmart como servicio objetivo del proyecto. Esta aplicación está compuesta por tres capas: frontend, backend y base de datos. El frontend se desplegó en una instancia EC2 pública y funciona como punto de entrada para los usuarios. El backend se desplegó en una instancia privada sin IP pública, mientras que MongoDB se ubicó en otra instancia privada, evitando la exposición directa de la lógica de negocio y de los datos hacia Internet.

La comunicación entre capas se organizó mediante Security Groups y reverse proxy. El usuario accede únicamente al frontend por HTTP, y este redirige las solicitudes hacia el backend privado mediante Nginx. A su vez, el backend se comunica con MongoDB usando la red interna de AWS. De esta forma, el flujo de comunicación queda controlado y alineado con buenas prácticas de seguridad.

Uptime Kuma se utilizó para monitorear el estado del frontend, el endpoint de salud del backend y la conexión del backend con MongoDB mediante el endpoint `/db-health`. Esto permite comprobar fallos reales de una aplicación distribuida, como la caída del backend o la pérdida de conexión con la base de datos, sin necesidad de exponer MongoDB a Internet. Con esta integración, el proyecto deja de monitorear únicamente sus propias herramientas internas y pasa a supervisar una arquitectura funcional con servicios separados por capas.
