# Seguridad de GastoSmart en AWS

## Enfoque

La seguridad del despliegue se basa en mínima exposición. El frontend es público porque es el punto de entrada de los usuarios; el backend y MongoDB quedan en instancias privadas sin IP pública.

## Security Groups

Los Security Groups deben terminar en `-sg`. No se deben crear nombres que empiecen por `sg-`, porque AWS usa ese formato para IDs internos.

Nombres usados por el proyecto:

```text
monitorizacion-sg
frontend-sg
backend-sg
mongodb-sg
```

Reglas esperadas según `cloud/iac_gastosmart_secure.yml`:

| Security Group | Entrada permitida |
| --- | --- |
| `monitorizacion-sg` | TCP 22, 3001 y 3000 solo desde `admin_cidr`. |
| `frontend-sg` | TCP 22 desde `admin_cidr`, TCP 80 desde `web_cidr`, TCP 9100 solo desde `admin_cidr` si se usa Node Exporter en frontend. |
| `backend-sg` | TCP 8000 desde `frontend-sg` y `monitorizacion-sg`; TCP 22 y 9100 desde `monitorizacion-sg`. |
| `mongodb-sg` | TCP 27017 solo desde `backend-sg`; TCP 22 y 9100 desde `monitorizacion-sg`. |

Prometheus `9090` y Node Exporter `9100` no deben abrirse públicamente a `0.0.0.0/0`. Si Node Exporter se consulta en instancias privadas, debe hacerse desde la instancia de monitorización o mediante proxy interno controlado.

## Capas privadas

El backend FastAPI escucha en el puerto 8000, pero no recibe tráfico directo desde Internet. Solo acepta solicitudes desde el frontend y desde la instancia de monitorización para health checks.

MongoDB escucha en el puerto 27017, pero solo acepta conexiones desde `backend-sg`. La salud de MongoDB se valida mediante `/db-health`, expuesto por el backend, sin abrir el puerto de base de datos al público.

## Variables sensibles

No se deben versionar:

- Llaves `.pem`.
- Archivos `.env` reales.
- Contraseñas.
- Access Keys de AWS.
- Tokens.
- Archivos dentro de `.secrets/`.
- Inventarios generados con IPs reales.

El repositorio incluye `.env.example` e `inventories/gastosmart_aws.ini.example` como plantillas seguras.

## CIDR administrativo

La variable `admin_cidr` define desde dónde se permite administrar la infraestructura. En `cloud/variables_gastosmart.yml` puede estar en `auto`, lo que permite detectar la IP pública actual del administrador y convertirla en `/32`.

Para una entrega final, se recomienda usar un valor concreto:

```text
admin_cidr: "MI_IP_PUBLICA/32"
```

No se debe usar `0.0.0.0/0` para SSH, Grafana o Uptime Kuma.

## Validaciones de seguridad

Comprobar que backend y MongoDB no tienen IP pública:

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=gastosmart-backend" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table

aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=gastosmart-mongodb" \
  --query "Reservations[*].Instances[*].{Name:Tags[?Key=='Name']|[0].Value,PrivateIP:PrivateIpAddress,PublicIP:PublicIpAddress,State:State.Name}" \
  --output table
```

Revisar reglas de Security Groups:

```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=monitorizacion-sg,frontend-sg,backend-sg,mongodb-sg" \
  --query "SecurityGroups[*].{Nombre:GroupName,Reglas:IpPermissions}" \
  --output json
```
