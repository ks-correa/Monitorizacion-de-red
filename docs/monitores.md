# Guía de monitores

## Objetivo

Esta guía describe los monitores actuales del proyecto **Monitorización de Red**. La solución combina Uptime Kuma para disponibilidad, Prometheus con Blackbox Exporter para probes HTTP/TCP, Node Exporter para métricas del servidor y Grafana para visualización.

El proyecto ya no monitorea únicamente servicios internos. También monitorea GastoSmart, una aplicación distribuida con frontend, backend y MongoDB.

## Herramientas de monitorización

| Herramienta | Función |
| --- | --- |
| Uptime Kuma | Monitoreo visual de disponibilidad HTTP, TCP y ping. |
| Prometheus | Recolección de métricas y resultados de probes. |
| Blackbox Exporter | Validación HTTP/TCP de endpoints externos o internos. |
| Node Exporter | Métricas del sistema operativo. |
| Grafana | Dashboard de métricas y disponibilidad. |

## Servicios monitoreados

| Servicio | Puerto | Descripción |
| --- | --- | --- |
| Uptime Kuma | `3001` | Herramienta principal de disponibilidad. |
| Grafana | `3000` | Panel de visualización de métricas. |
| Prometheus | `9090` | Recolector de métricas. No debe abrirse públicamente. |
| Node Exporter | `9100` | Métricas del servidor. No debe abrirse públicamente a `0.0.0.0/0`. |
| Blackbox Exporter | `9115` | Probes HTTP/TCP usados por Prometheus. |
| GastoSmart Frontend | `80` en AWS, `8080` en local | Capa pública de la aplicación. |
| GastoSmart Backend | `8000` | API privada FastAPI. |
| MongoDB | `27017` | Base de datos privada validada mediante `/db-health`. |

## Monitores en AWS

Estos monitores se crean o validan desde la instancia de monitorización.

| Monitor | Tipo | Objetivo | Resultado esperado |
| --- | --- | --- | --- |
| Uptime Kuma AWS | HTTP | `http://IP_MONITORIZACION:3001` | UP |
| Grafana AWS | HTTP | `http://IP_MONITORIZACION:3000` | UP |
| GastoSmart Frontend | HTTP | `http://IP_PUBLICA_FRONTEND` | UP |
| GastoSmart Backend Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/health` | UP |
| GastoSmart DB Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/db-health` | UP |
| Google DNS | Ping | `8.8.8.8` | UP |
| SSH Frontend | TCP | `IP_PUBLICA_FRONTEND:22` | UP si `admin_cidr` lo permite. |
| SSH Backend | TCP | `IP_PRIVADA_BACKEND:22` | UP si el bastión y el Security Group lo permiten. |
| SSH MongoDB | TCP | `IP_PRIVADA_MONGODB:22` | UP si el bastión y el Security Group lo permiten. |

La base de datos no se monitorea abriendo MongoDB al exterior. El monitor `GastoSmart DB Health` valida la conexión real backend-MongoDB sin exponer `27017`.

## Monitores locales

En local se recomienda validar:

| Monitor | Tipo | Objetivo |
| --- | --- | --- |
| GastoSmart Frontend Local | HTTP | `http://localhost:8080` |
| Backend Health Local | HTTP | `http://localhost:8080/api/health` |
| DB Health Local | HTTP | `http://localhost:8080/api/db-health` |
| Backend directo Local | HTTP | `http://localhost:8000/health` |
| DB directo Local | HTTP | `http://localhost:8000/db-health` |

Si también se levanta el stack de métricas local, se pueden validar:

```text
Uptime Kuma:   http://localhost:3001
Grafana:       http://localhost:3000
Prometheus:    http://localhost:9090
Node Exporter: http://localhost:9100/metrics
```

## Prometheus y Blackbox Exporter

El archivo de configuración actual es:

```text
metricas/prometheus.yml
```

Prometheus consulta Blackbox Exporter para validar:

```text
http://IP_PUBLICA_FRONTEND/
http://IP_PUBLICA_FRONTEND/api/health
http://IP_PUBLICA_FRONTEND/api/db-health
```

También puede recolectar métricas de Node Exporter mediante rutas proxy controladas por Nginx en el frontend, por ejemplo:

```text
/node-frontend/metrics
/node-backend/metrics
/node-mongodb/metrics
```

Estas rutas solo deben existir si las reglas de seguridad permiten el acceso de forma controlada. No se debe abrir Node Exporter directamente a Internet.

## Grafana

Grafana usa Prometheus como fuente de datos. Dentro de Docker, la URL recomendada es:

```text
http://prometheus:9090
```

Dashboard actual:

```text
GastoSmart - Monitoreo Distribuido
```

El dashboard muestra:

- Disponibilidad del frontend.
- Salud del backend.
- Salud indirecta de MongoDB mediante `/db-health`.
- Latencia por capa.
- Códigos HTTP.
- Caídas detectadas.
- Métricas básicas del servidor.

## Obtener objetivos desde el inventario

El inventario actual de GastoSmart se genera en:

```text
inventories/gastosmart_aws.ini
```

Actualizarlo:

```bash
./scripts/update_inventory_gastosmart.sh
```

Obtener frontend público:

```bash
awk '/^frontend / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' inventories/gastosmart_aws.ini
```

Obtener backend privado:

```bash
awk '/^backend / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' inventories/gastosmart_aws.ini
```

Obtener MongoDB privado:

```bash
awk '/^mongodb / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print a[2]}}' inventories/gastosmart_aws.ini
```

## Validaciones rápidas

Desde el equipo administrador:

```bash
./scripts/test_gastosmart_aws.sh
```

Desde la instancia de monitorización:

```bash
curl http://IP_PRIVADA_BACKEND:8000/health
curl http://IP_PRIVADA_BACKEND:8000/db-health
```

Desde Prometheus, una consulta útil para validar Blackbox Exporter:

```promql
probe_success{job=~"gastosmart_.*"}
```

Un valor `1` indica que el probe está disponible; un valor `0` indica fallo.

## Evidencias recomendadas

Para el informe, capturar:

- Uptime Kuma con monitores de GastoSmart en UP.
- Uptime Kuma con un monitor en DOWN durante una prueba de fallo.
- Grafana con el dashboard `GastoSmart - Monitoreo Distribuido`.
- Prometheus mostrando `probe_success`.
- Comandos `curl` de `/health` y `/db-health`.
- Validación de que backend y MongoDB no tienen IP pública.
