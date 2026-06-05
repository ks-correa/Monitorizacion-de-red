# Monitorización de Red con GastoSmart

## Descripción general

Este repositorio implementa una solución de **monitorización de red** aplicada a dos entornos: local y AWS. La solución permite validar disponibilidad de servicios, estado de endpoints, conectividad entre capas, métricas del servidor y comportamiento de una aplicación distribuida real.

La aplicación monitoreada es **GastoSmart**, un sistema web compuesto por frontend, backend y base de datos MongoDB. Su integración permite comprobar la monitorización sobre una arquitectura funcional, no solamente sobre servicios internos como Grafana, Prometheus o Uptime Kuma.

La pila de observabilidad está formada por:

- **Uptime Kuma**, para monitoreo visual de disponibilidad.
- **Prometheus**, para recolección de métricas.
- **Blackbox Exporter**, para pruebas HTTP hacia endpoints.
- **Node Exporter**, para métricas del sistema operativo.
- **Grafana**, para visualización mediante dashboards.

## Servicio seleccionado

El servicio seleccionado es **monitorización de red**. El objetivo es supervisar la disponibilidad de nodos, servicios y endpoints, detectar fallos, validar la comunicación entre capas y disponer de evidencias visuales mediante paneles y monitores.

En el proyecto se monitorean servicios locales y servicios desplegados en AWS. También se valida el estado de GastoSmart mediante endpoints de salud:

```text
/health
/db-health
```

El endpoint `/health` valida que el backend esté activo. El endpoint `/db-health` valida que el backend pueda conectarse correctamente con MongoDB.

## Tecnologías utilizadas

| Tecnología | Uso en el proyecto |
| --- | --- |
| Ansible | Automatización de infraestructura, configuración y despliegues. |
| AWS EC2 | Instancias cloud para frontend, backend, MongoDB y monitorización. |
| Security Groups | Control de tráfico por capa y principio de mínima exposición. |
| Docker | Ejecución de servicios en contenedores. |
| Docker Compose | Orquestación local de GastoSmart y del stack de métricas. |
| Uptime Kuma | Monitoreo de disponibilidad HTTP/TCP. |
| Prometheus | Recolección de métricas y resultados de probes. |
| Blackbox Exporter | Pruebas HTTP hacia endpoints monitoreados. |
| Node Exporter | Métricas del sistema operativo. |
| Grafana | Dashboards de disponibilidad y métricas. |
| Nginx | Servidor del frontend y reverse proxy hacia el backend. |
| React/Vite | Frontend de GastoSmart. |
| FastAPI | Backend de GastoSmart. |
| MongoDB | Base de datos de GastoSmart. |
| Linux/Lubuntu | Sistema base para pruebas locales y administración. |

## Arquitectura local

En local, GastoSmart se ejecuta con Docker Compose en una sola máquina, pero separado en contenedores. El frontend se sirve con Nginx en `http://localhost:8080`, el backend FastAPI responde en `http://localhost:8000` y MongoDB queda dentro de la red interna de Docker.

| Servicio | Contenedor | Puerto | Función |
| --- | --- | --- | --- |
| Frontend | `gastosmart-frontend` | `8080:80` | Interfaz web React/Vite servida por Nginx. |
| Backend | `gastosmart-backend` | `8000:8000` | API FastAPI y endpoints de salud. |
| MongoDB | `gastosmart-mongodb` | Red interna Docker | Base de datos de la aplicación. |

El frontend usa Nginx como reverse proxy. Por eso, las solicitudes a:

```text
http://localhost:8080/api/health
http://localhost:8080/api/db-health
```

llegan al backend a través de la ruta `/api`.

## Monitorización local

El entorno local también cuenta con servicios de monitorización. Estos servicios permiten generar evidencias sin depender de AWS.

| Servicio | Contenedor | Puerto local | Función |
| --- | --- | --- | --- |
| Uptime Kuma | `uptime-kuma` | `3001` | Monitores visuales de disponibilidad. |
| Grafana | `grafana` | `3000` | Dashboards de métricas. |
| Prometheus | `prometheus` | `9090` | Recolección de métricas. |
| Node Exporter | `node-exporter` | `9100` | Métricas del host local. |
| Blackbox Exporter | `blackbox-exporter` | Interno | Probes HTTP usados por Prometheus. |

Prometheus local usa el archivo:

```text
metricas/prometheus.local.yml
```

Este archivo apunta a los endpoints locales de GastoSmart y permite alimentar dashboards como:

```text
GastoSmart Local - Monitoreo
Node Exporter Full
```

## Levantar GastoSmart localmente

Levantar GastoSmart:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Validar la aplicación:

```bash
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
curl http://localhost:8000/health
curl http://localhost:8000/db-health
```

Resultado esperado para `/health`:

```json
{
  "status": "ok",
  "service": "gastosmart-backend"
}
```

Resultado esperado para `/db-health`:

```json
{
  "status": "ok",
  "database": "mongodb"
}
```

También se puede usar el script:

```bash
./scripts/deploy_gastosmart_local.sh
```

## Levantar monitorización local

Levantar Prometheus, Grafana, Node Exporter y Blackbox Exporter:

```bash
./scripts/deploy_metricas_local.sh
```

Levantar Uptime Kuma local:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Accesos locales:

```text
Uptime Kuma: http://localhost:3001
Grafana:     http://localhost:3000
Prometheus:  http://localhost:9090
Node Exporter: http://localhost:9100/metrics
```

La contraseña de Grafana se gestiona mediante:

```text
.secrets/grafana_admin_password
```

Este archivo no debe compartirse ni subirse a repositorios públicos.

## Arquitectura en AWS

En AWS se usa una arquitectura distribuida por capas. La infraestructura se despliega en una VPC de GastoSmart con subred pública y subred privada.

| Capa | Instancia | IP pública | Servicio | Acceso permitido |
| --- | --- | --- | --- | --- |
| Monitorización | `gastosmart-monitorizacion` | Sí | Uptime Kuma, Grafana, Prometheus, Node Exporter y Blackbox Exporter | Solo IP administrativa para administración web y SSH. |
| Frontend | `gastosmart-frontend` | Sí | Nginx + React/Vite | HTTP público o restringido según `web_cidr`. |
| Backend | `gastosmart-backend` | No | FastAPI | Solo `frontend-sg` y `monitorizacion-sg`. |
| Base de datos | `gastosmart-mongodb` | No | MongoDB | Solo `backend-sg`. |

Flujo principal:

```text
Usuario -> Frontend público -> Nginx reverse proxy -> Backend privado -> MongoDB privado
```

El usuario no accede directamente al backend ni a MongoDB. Las solicitudes de la aplicación entran por el frontend y Nginx redirige `/api` hacia el backend privado.

## Monitorización en AWS

La instancia `gastosmart-monitorizacion` ejecuta el stack de observabilidad. Desde esta instancia se validan el frontend público y los endpoints internos del backend.

Servicios principales:

```text
Uptime Kuma: puerto 3001
Grafana: puerto 3000
Prometheus: puerto 9090
Node Exporter: puerto 9100
Blackbox Exporter: puerto 9115 interno
```

Dashboards de Grafana utilizados:

```text
GastoSmart - Monitoreo Distribuido
Node Exporter Full
```

Prometheus usa Blackbox Exporter para consultar los endpoints de GastoSmart definidos en:

```text
metricas/prometheus.yml
```

## Despliegue en AWS

Antes del despliegue se deben revisar las variables principales:

```text
cloud/variables_gastosmart.yml
cloud/variables_aws.yml
```

Crear infraestructura segura:

```bash
ansible-playbook cloud/iac_gastosmart_secure.yml
```

Actualizar inventario con las IP actuales:

```bash
./scripts/update_inventory_gastosmart.sh
```

Desplegar servicios por capa:

```bash
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_mongodb.yml
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_backend.yml
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_frontend.yml
```

Configurar proxy y monitores:

```bash
ansible-playbook -i inventories/gastosmart_aws.ini cloud/configurar_proxy_frontend.yml
ansible-playbook -i inventories/gastosmart_aws.ini cloud/configurar_monitores_gastosmart.yml
```

Ejecutar flujo completo:

```bash
./scripts/deploy_gastosmart_aws.sh
```

Validar despliegue:

```bash
./scripts/test_gastosmart_aws.sh
```

## Seguridad aplicada

El proyecto aplica varias medidas para reducir la exposición:

- El frontend es la única capa visible para usuarios.
- El backend no tiene IP pública.
- MongoDB no tiene IP pública.
- MongoDB no se expone a `0.0.0.0/0`.
- El backend no se expone a `0.0.0.0/0`.
- Los Security Groups están separados por función.
- El acceso administrativo se restringe por CIDR.
- Grafana, Uptime Kuma y Prometheus se restringen a la IP administrativa.
- Las credenciales reales no deben versionarse.
- Los nombres de Security Groups terminan en `-sg`.

Security Groups esperados:

```text
monitorizacion-sg
frontend-sg
backend-sg
mongodb-sg
```

No se deben crear Security Groups con nombres que empiecen por `sg-`, porque AWS puede confundir ese formato con IDs internos.

## Monitores configurados

Uptime Kuma se usa para validar disponibilidad visual. Prometheus y Blackbox Exporter recolectan métricas de probes HTTP. Node Exporter aporta métricas del sistema.

Monitores principales:

| Monitor | Herramienta | Qué valida |
| --- | --- | --- |
| GastoSmart Frontend | Uptime Kuma / Blackbox | Disponibilidad de la capa pública o local. |
| Backend Health | Uptime Kuma / Blackbox | Backend FastAPI activo. |
| DB Health | Uptime Kuma / Blackbox | Conexión real entre backend y MongoDB. |
| Grafana | Uptime Kuma | Panel de métricas activo. |
| Uptime Kuma | Uptime Kuma | Servicio de disponibilidad activo. |
| Prometheus | Uptime Kuma | Recolector de métricas activo. |
| Node Exporter | Prometheus / Uptime Kuma | Métricas del servidor. |

MongoDB se monitorea de forma indirecta mediante `/db-health`, sin exponer directamente el puerto `27017`.

## Dashboards de Grafana

El proyecto utiliza dashboards para evidenciar el funcionamiento del sistema:

| Dashboard | Entorno | Función |
| --- | --- | --- |
| `GastoSmart Local - Monitoreo` | Local | Disponibilidad y latencia de GastoSmart local. |
| `GastoSmart - Monitoreo Distribuido` | AWS | Disponibilidad, latencia y estado por capas en AWS. |
| `Node Exporter Full` | Local/AWS | Métricas detalladas de CPU, memoria, disco, red y carga del sistema. |

Si un entorno de Grafana recién desplegado aparece sin dashboards, se debe crear el datasource `Prometheus` con URL interna `http://prometheus:9090` e importar los dashboards correspondientes desde la interfaz o mediante la API de Grafana.

## Estructura del repositorio

```text
.
|-- README.md
|-- ansible.cfg
|-- apps/
|   `-- gastosmart/
|       |-- docker-compose.local.yml
|       |-- frontend/
|       |-- backend/
|       |-- mongodb/
|       `-- scripts/
|-- cloud/
|   |-- iac_gastosmart_secure.yml
|   |-- variables_gastosmart.yml
|   |-- desplegar_gastosmart_frontend.yml
|   |-- desplegar_gastosmart_backend.yml
|   |-- desplegar_gastosmart_mongodb.yml
|   |-- configurar_proxy_frontend.yml
|   |-- configurar_monitores_gastosmart.yml
|   `-- desplegar_metricas_aws.yml
|-- docker/
|   `-- docker-compose.yml
|-- docs/
|-- inventories/
|-- local/
|   |-- desplegar_local.yml
|   |-- desplegar_metricas_local.yml
|   `-- inventory_local.ini
|-- metricas/
|   |-- docker-compose-metricas.yml
|   |-- prometheus.yml
|   `-- prometheus.local.yml
`-- scripts/
```

## Comandos principales

Levantar GastoSmart local:

```bash
./scripts/deploy_gastosmart_local.sh
```

Levantar métricas locales:

```bash
./scripts/deploy_metricas_local.sh
```

Levantar Uptime Kuma local:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Validar GastoSmart local:

```bash
./apps/gastosmart/scripts/validar_local.sh
```

Desplegar GastoSmart en AWS:

```bash
./scripts/deploy_gastosmart_aws.sh
```

Actualizar inventario AWS:

```bash
./scripts/update_inventory_gastosmart.sh
```

Probar GastoSmart en AWS:

```bash
./scripts/test_gastosmart_aws.sh
```

Consultar instancias de GastoSmart en AWS:

```bash
aws ec2 describe-instances \
  --region us-east-1 \
  --filters "Name=tag:Aplicacion,Values=GastoSmart" \
  --query "Reservations[].Instances[].{Nombre:Tags[?Key=='Name']|[0].Value,Estado:State.Name,IP_Publica:PublicIpAddress,IP_Privada:PrivateIpAddress}" \
  --output table
```

Consultar Security Groups:

```bash
aws ec2 describe-security-groups \
  --region us-east-1 \
  --filters "Name=group-name,Values=monitorizacion-sg,frontend-sg,backend-sg,mongodb-sg" \
  --output table
```

## Pruebas de fallo

El proyecto incluye scripts para pruebas de caída y recuperación en local:

```bash
./apps/gastosmart/scripts/probar_fallos_local.sh
```

También se pueden detener servicios manualmente para observar el cambio en Uptime Kuma, Prometheus y Grafana:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml stop gastosmart-backend
docker compose -f apps/gastosmart/docker-compose.local.yml start gastosmart-backend
```

## Documentación adicional

La carpeta `docs/` contiene documentación complementaria para el informe, incluyendo arquitectura segura, monitores, pruebas de fallo, evidencias y medidas de seguridad.

## Notas importantes

- Las IP públicas de AWS pueden cambiar si se recrean instancias.
- Después de cambios en AWS, se debe ejecutar `./scripts/update_inventory_gastosmart.sh`.
- Los archivos `.env`, llaves `.pem`, tokens y contraseñas reales no deben versionarse.
- Este proyecto tiene fines académicos y demostrativos. Para producción se recomienda agregar HTTPS, backups, alta disponibilidad, gestión centralizada de secretos y alertas externas.
