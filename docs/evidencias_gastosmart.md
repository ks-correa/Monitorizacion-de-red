# Evidencias GastoSmart

## Comandos locales

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
curl http://localhost:8000/health
curl http://localhost:8000/db-health
```

## Comandos AWS

```bash
scripts/deploy_gastosmart_aws.sh
scripts/test_gastosmart_aws.sh
```

Validar IP publica del backend:

```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=gastosmart-backend" --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" --output table
```

Validar IP publica de MongoDB:

```bash
aws ec2 describe-instances --filters "Name=tag:Name,Values=gastosmart-mongodb" --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" --output table
```

Validar Security Groups:

```bash
aws ec2 describe-security-groups --filters "Name=group-name,Values=monitorizacion-sg,frontend-sg,backend-sg,mongodb-sg" --query "SecurityGroups[*].{Nombre:GroupName,Reglas:IpPermissions}" --output json
```

## Monitorizacion de aplicacion distribuida GastoSmart

Para fortalecer el uso real de la solucion de monitorizacion, se integro la aplicacion GastoSmart como servicio objetivo del proyecto. Esta aplicacion esta compuesta por tres capas: frontend, backend y base de datos. El frontend se desplego en una instancia EC2 publica y funciona como punto de entrada para los usuarios. El backend se desplego en una instancia privada sin IP publica, mientras que MongoDB se ubico en otra instancia privada, evitando la exposicion directa de la logica de negocio y de los datos hacia Internet.

La comunicacion entre capas se organizo mediante Security Groups y reverse proxy. El usuario accede unicamente al frontend por HTTP, y este redirige las solicitudes hacia el backend privado mediante Nginx. A su vez, el backend se comunica con MongoDB usando la red interna de AWS. De esta forma, el flujo de comunicacion queda controlado y alineado con buenas practicas de seguridad.

Uptime Kuma se utilizo para monitorear el estado del frontend, el endpoint de salud del backend y la conexion del backend con MongoDB mediante el endpoint `/db-health`. Esto permite comprobar fallos reales de una aplicacion distribuida, como la caida del backend o la perdida de conexion con la base de datos, sin necesidad de exponer MongoDB a Internet. Con esta integracion, el proyecto deja de monitorear unicamente sus propias herramientas internas y pasa a supervisar una arquitectura funcional con servicios separados por capas.
