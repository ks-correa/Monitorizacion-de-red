# Monitorizacion de Red

## Descripcion general

Este repositorio implementa una solucion de monitorizacion de red en entorno local y en AWS. El proyecto usa Uptime Kuma para comprobar disponibilidad, Prometheus con Blackbox Exporter para pruebas HTTP/TCP, Node Exporter para metricas del servidor y Grafana para visualizar el estado de la infraestructura.

Como mejora principal, se integro GastoSmart como aplicacion distribuida monitoreada. Esto permite validar la monitorizacion sobre un sistema real compuesto por frontend, backend y base de datos, no solamente sobre herramientas internas como Grafana, Uptime Kuma o Prometheus.

## Servicio seleccionado

El servicio seleccionado es **Monitorizacion de red**. El objetivo es supervisar el estado de servicios, disponibilidad de nodos, respuesta de endpoints, conectividad entre capas, metricas basicas del servidor y deteccion de fallos.

Inicialmente la solucion monitoreaba servicios propios del laboratorio, como Grafana, Uptime Kuma, SSH y sitios externos. Luego se agrego GastoSmart para comprobar el comportamiento de una aplicacion real con tres capas: frontend publico, backend privado y MongoDB privado.

## Tecnologias utilizadas

| Tecnologia | Uso en el proyecto |
| --- | --- |
| Ansible | Automatizacion de infraestructura, configuracion y despliegues. |
| AWS EC2 | Instancias cloud para monitorizacion, frontend, backend y MongoDB. |
| Security Groups | Control de trafico por capa y aplicacion de minima exposicion. |
| Docker | Ejecucion de servicios en contenedores. |
| Docker Compose | Orquestacion local de GastoSmart y stack de metricas. |
| Uptime Kuma | Monitoreo de disponibilidad HTTP, TCP y servicios internos. |
| Prometheus | Recoleccion de metricas y resultados de probes. |
| Blackbox Exporter | Pruebas HTTP/TCP hacia endpoints monitoreados. |
| Node Exporter | Metricas del servidor Linux. |
| Grafana | Visualizacion de metricas y dashboard personalizado. |
| Nginx | Servidor del frontend y reverse proxy hacia el backend. |
| React/Vite | Frontend de GastoSmart. |
| FastAPI | Backend de GastoSmart. |
| MongoDB | Base de datos de GastoSmart. |
| Linux/Lubuntu | Sistema base para pruebas locales y administracion. |

## Arquitectura local

En local, GastoSmart se levanta con Docker Compose en una sola maquina, pero separado en contenedores. El frontend se sirve con Nginx en `http://localhost:8080`, el backend FastAPI responde en `http://localhost:8000` y MongoDB queda como base de datos local dentro de la red Docker.

El frontend se comunica con el backend usando la ruta `/api`, por lo que las llamadas como `http://localhost:8080/api/health` pasan por Nginx y llegan al backend. La conectividad con MongoDB se valida desde el backend mediante `/db-health`. El objetivo del entorno local es comprobar que la aplicacion funciona correctamente antes de llevarla a AWS.

| Servicio | Contenedor | Puerto | Funcion |
| --- | --- | --- | --- |
| Frontend | `gastosmart-frontend` | `8080:80` | Interfaz web React/Vite servida por Nginx. |
| Backend | `gastosmart-backend` | `8000:8000` | API FastAPI y endpoints de salud. |
| MongoDB | `gastosmart-mongodb` | Red interna Docker | Base de datos de la aplicacion. |

## Levantar GastoSmart localmente

Levantar el entorno local:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Validar frontend, backend y base de datos:

```bash
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
curl http://localhost:8000/health
curl http://localhost:8000/db-health
curl http://localhost:8080/api/test
```

El endpoint `/health` debe indicar que el backend esta activo:

```json
{
  "status": "ok",
  "service": "gastosmart-backend"
}
```

El endpoint `/db-health` debe indicar si el backend logra conectarse a MongoDB:

```json
{
  "status": "ok",
  "database": "mongodb"
}
```

Ver contenedores activos:

```bash
docker ps
```

Detener el entorno local:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml down
```

Tambien se pueden usar los scripts del proyecto:

```bash
./scripts/deploy_gastosmart_local.sh
./apps/gastosmart/scripts/validar_local.sh
./apps/gastosmart/scripts/probar_health_local.sh
./apps/gastosmart/scripts/probar_fallos_local.sh
```

## Arquitectura en AWS

En AWS se usa una arquitectura distribuida por capas con varias instancias EC2. La instancia de monitorizacion ejecuta Uptime Kuma, Grafana, Prometheus, Node Exporter y Blackbox Exporter. La instancia frontend es publica y sirve React/Vite con Nginx. La instancia backend es privada, no tiene IP publica y ejecuta FastAPI. La instancia MongoDB tambien es privada y solo acepta trafico desde el backend.

| Capa | Instancia | IP publica | Servicio | Acceso permitido |
| --- | --- | --- | --- | --- |
| Monitorizacion | `monitorizacion-red-uptime-kuma` | Si | Kuma, Grafana, Prometheus, Node Exporter, Blackbox Exporter | Solo IP administrativa para administracion web y SSH. |
| Frontend | `gastosmart-frontend` | Si | Nginx + React/Vite | HTTP publico o restringido segun `web_cidr`. |
| Backend | `gastosmart-backend` | No | FastAPI | Solo `frontend-sg` y `monitorizacion-sg`. |
| Base de datos | `gastosmart-mongodb` | No | MongoDB | Solo `backend-sg`. |

## Flujo de comunicacion en AWS

```text
Usuario -> Frontend publico -> Nginx reverse proxy -> Backend privado -> MongoDB privado
```

El usuario nunca accede directamente al backend. Las solicitudes de la aplicacion entran por el frontend y Nginx redirige `/api` hacia el backend privado. MongoDB nunca queda expuesto a Internet y no se monitorea abriendo el puerto `27017`; su estado se valida desde el backend mediante `/db-health`.

Uptime Kuma y Prometheus/Blackbox Exporter pueden comprobar el frontend publico y los endpoints internos del backend desde la instancia de monitorizacion dentro de la VPC.

## Despliegue en AWS

Antes de desplegar en AWS se deben configurar las variables principales: region, llave SSH, CIDR administrativo, nombres de instancias, VPC/subredes si aplica y nombres de Security Groups. Estas variables se encuentran principalmente en:

```text
cloud/variables_gastosmart.yml
cloud/variables_aws.yml
```

Desplegar infraestructura de GastoSmart:

```bash
ansible-playbook cloud/iac_gastosmart_secure.yml
```

Actualizar inventario con las IPs actuales:

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

Tambien se puede ejecutar el flujo completo con:

```bash
./scripts/deploy_gastosmart_aws.sh
```

Probar el despliegue:

```bash
./scripts/test_gastosmart_aws.sh
```

## Seguridad aplicada

El proyecto aplica buenas practicas de seguridad para reducir exposicion:

- El frontend es la unica capa visible para usuarios.
- El backend no tiene IP publica.
- MongoDB no tiene IP publica.
- MongoDB no se expone en `0.0.0.0/0`.
- El backend no se expone en `0.0.0.0/0`.
- Los Security Groups estan separados por funcion.
- El acceso administrativo se restringe por CIDR.
- Prometheus `9090` y Node Exporter `9100` no quedan abiertos publicamente.
- No se versionan llaves `.pem`, `.env` reales, Access Keys, tokens ni credenciales.
- Los nombres de Security Groups terminan en `-sg`.

No se deben crear Security Groups con nombres que empiecen por `sg-`, porque AWS puede confundir ese formato con IDs internos de Security Groups. Usar nombres como:

```text
monitorizacion-sg
frontend-sg
backend-sg
mongodb-sg
```

## Monitorizacion configurada

Uptime Kuma se usa para monitoreo operativo y alertas de disponibilidad. Prometheus con Blackbox Exporter recolecta probes HTTP/TCP para construir paneles en Grafana. Node Exporter aporta metricas del servidor donde corre la monitorizacion.

| Monitor | Herramienta | Objetivo | Que valida |
| --- | --- | --- | --- |
| GastoSmart Frontend | Uptime Kuma / Blackbox | `http://IP_FRONTEND` | Disponibilidad de la capa publica. |
| Backend Health | Uptime Kuma / Blackbox | `http://IP_BACKEND:8000/health` | Backend FastAPI activo. |
| DB Health | Uptime Kuma / Blackbox | `http://IP_BACKEND:8000/db-health` | Conexion real entre backend y MongoDB. |
| Grafana | Uptime Kuma | `http://localhost:3000` | Panel de metricas activo. |
| Uptime Kuma | Uptime Kuma | `http://localhost:3001` | Servicio de monitoreo activo. |
| Node Exporter | Prometheus | `localhost:9100` | Metricas del servidor. |

El endpoint `/db-health` permite monitorear MongoDB sin exponer directamente el puerto `27017` hacia Internet.

## Grafana

Grafana incluye un dashboard personalizado para GastoSmart:

```text
GastoSmart - Monitoreo Distribuido
```

El dashboard muestra disponibilidad del frontend, salud del backend, estado indirecto de MongoDB, latencia por capa, codigos HTTP, caidas detectadas y metricas basicas del servidor.

## Estructura del repositorio

```text
.
|-- README.md
|-- .gitignore
|-- .dockerignore
|-- ansible.cfg
|-- apps/
|   `-- gastosmart/
|       |-- docker-compose.local.yml
|       |-- .env.example
|       |-- frontend/
|       |   |-- Dockerfile
|       |   |-- nginx.local.conf
|       |   |-- nginx.aws.conf
|       |   |-- package.json
|       |   `-- src/
|       |-- backend/
|       |   |-- Dockerfile
|       |   |-- .env.example
|       |   |-- main.py
|       |   |-- requirements.txt
|       |   |-- config/
|       |   |-- database/
|       |   |-- models/
|       |   |-- routers/
|       |   `-- services/
|       |-- mongodb/
|       |   |-- mongod.conf
|       |   `-- init-mongo.js
|       `-- scripts/
|-- cloud/
|   |-- iac_gastosmart_secure.yml
|   |-- variables_gastosmart.yml
|   |-- desplegar_gastosmart_frontend.yml
|   |-- desplegar_gastosmart_backend.yml
|   |-- desplegar_gastosmart_mongodb.yml
|   |-- configurar_proxy_frontend.yml
|   `-- configurar_monitores_gastosmart.yml
|-- docs/
|-- inventories/
|-- local/
|-- metricas/
`-- scripts/
```

## Comandos principales

Levantar GastoSmart local:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
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

Destruir recursos de GastoSmart en AWS:

```bash
./scripts/destroy_gastosmart_aws.sh
```

Ver logs del backend local:

```bash
docker logs -f gastosmart-backend
```

Ver logs del backend en AWS:

```bash
ansible -i inventories/gastosmart_aws.ini backend -b -m shell -a "docker logs gastosmart-backend --tail 80"
```

## Documentacion adicional

La explicacion detallada para el informe se encuentra en `docs/`, incluyendo arquitectura segura, monitores, pruebas de fallo, evidencias y medidas de seguridad aplicadas.
