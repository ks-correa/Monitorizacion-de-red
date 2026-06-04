# Monitorizacion de Red

Proyecto academico para desplegar una solucion de monitorizacion en local y AWS usando Ansible, Docker, Docker Compose, Uptime Kuma, Prometheus, Blackbox Exporter, Node Exporter y Grafana.

La mejora principal del proyecto es la integracion de GastoSmart como aplicacion distribuida real, con frontend publico, backend privado y MongoDB privado.

## Arquitectura Actual

```text
Usuario
  |
  | HTTP 80
  v
Frontend EC2 publica
  Nginx + React/Vite
  /api -> proxy privado
  |
  | TCP 8000 permitido solo desde frontend-sg
  v
Backend EC2 privada
  FastAPI
  /health
  /db-health
  |
  | TCP 27017 permitido solo desde backend-sg
  v
MongoDB EC2 privada
```

La instancia de monitorizacion conserva Uptime Kuma, Prometheus, Blackbox Exporter, Node Exporter y Grafana. Prometheus usa Blackbox Exporter para medir la disponibilidad real de:

- GastoSmart Frontend.
- GastoSmart Backend Health.
- GastoSmart DB Health, que valida MongoDB indirectamente sin exponer `27017`.

## Estructura

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
|       |   |-- health_endpoints.md
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
|           |-- validar_local.sh
|           |-- probar_health_local.sh
|           `-- probar_fallos_local.sh
|-- cloud/
|   |-- iac_aws.yml
|   |-- variables_aws.yml
|   |-- desplegar_kuma_aws.yml
|   |-- desplegar_metricas_aws.yml
|   |-- iac_gastosmart_secure.yml
|   |-- variables_gastosmart.yml
|   |-- desplegar_gastosmart_frontend.yml
|   |-- desplegar_gastosmart_backend.yml
|   |-- desplegar_gastosmart_mongodb.yml
|   |-- configurar_proxy_frontend.yml
|   `-- configurar_monitores_gastosmart.yml
|-- docker/
|-- docs/
|-- inventories/
|-- local/
|-- metricas/
`-- scripts/
```

## Requisitos

- Linux o WSL.
- Docker y Docker Compose.
- Ansible.
- AWS CLI configurado para despliegue en nube.
- Coleccion de Ansible para AWS:

```bash
ansible-galaxy collection install amazon.aws
```

## Ejecucion Local

Levantar GastoSmart local:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Validar:

```bash
apps/gastosmart/scripts/validar_local.sh
```

Endpoints esperados:

```bash
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
curl http://localhost:8000/health
curl http://localhost:8000/db-health
```

Pruebas de fallo local:

```bash
apps/gastosmart/scripts/probar_fallos_local.sh
```

## Codigos de Verificacion

En local y AWS, el backend usa por defecto:

```text
EMAIL_DELIVERY_MODE=console
```

Para ver el codigo de registro o recuperacion en local:

```bash
docker logs -f gastosmart-backend
```

Para verlo en AWS:

```bash
ansible -i inventories/gastosmart_aws.ini backend -b -m shell -a "docker logs gastosmart-backend --tail 80"
```

Para envio real por correo, configurar `EMAIL_DELIVERY_MODE=smtp` en un `.env` real no versionado.

## AWS

Actualizar inventario con IPs actuales:

```bash
scripts/update_inventory_gastosmart.sh
```

Desplegar infraestructura GastoSmart:

```bash
ansible-playbook cloud/iac_gastosmart_secure.yml
```

Desplegar servicios por capa:

```bash
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_mongodb.yml
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_backend.yml
ansible-playbook -i inventories/gastosmart_aws.ini cloud/desplegar_gastosmart_frontend.yml
```

Probar arquitectura AWS:

```bash
scripts/test_gastosmart_aws.sh
```

## Estado Actual En AWS

Instancias esperadas:

| Capa | IP publica | IP privada | Exposicion |
| --- | --- | --- | --- |
| Monitorizacion | Si | Si | Uptime Kuma y Grafana solo desde IP administrativa |
| Frontend | Si | Si | HTTP 80 publico |
| Backend | No | Si | TCP 8000 solo desde frontend-sg y monitorizacion-sg |
| MongoDB | No | Si | TCP 27017 solo desde backend-sg |

El frontend publico actual se obtiene con:

```bash
awk '/^frontend / {for(i=1;i<=NF;i++) if($i ~ /^ansible_host=/) {split($i,a,"="); print "http://" a[2]}}' inventories/gastosmart_aws.ini
```

## Uptime Kuma

Kuma monitorea:

- Uptime Kuma AWS.
- SSH AWS.
- Grafana AWS.
- GastoSmart Frontend.
- GastoSmart Backend Health.
- GastoSmart DB Health.
- Google DNS.
- Sitio Web Externo.

Los monitores internos de la instancia de monitorizacion deben apuntar a la IP privada de esa instancia, no a `localhost`, porque Kuma corre dentro de un contenedor.

## Grafana

Grafana tiene un dashboard personalizado:

```text
GastoSmart - Monitoreo Distribuido
```

UID:

```text
gastosmart-distribuida
```

Incluye:

- Estado del frontend.
- Estado del backend.
- Estado indirecto de MongoDB mediante `/api/db-health`.
- Disponibilidad global.
- Latencia por capa.
- Codigos HTTP.
- Caidas detectadas.
- CPU de la instancia de monitorizacion.

Prometheus obtiene estas metricas con Blackbox Exporter, configurado en:

```text
metricas/prometheus.yml
metricas/docker-compose-metricas.yml
```

## Seguridad

Buenas practicas aplicadas:

- No versionar llaves `.pem`.
- No versionar `.env` reales.
- No versionar contrasenas ni secretos.
- No versionar inventarios generados con IPs reales.
- No abrir backend a Internet.
- No abrir MongoDB a Internet.
- No abrir Prometheus `9090` ni Node Exporter `9100` publicamente.
- Backend y MongoDB no tienen IP publica.
- MongoDB se monitorea indirectamente con `/db-health`.
- Los Security Groups de GastoSmart terminan en `-sg`.
- No usar nombres que empiecen por `sg-`.

Nombres correctos:

```text
monitorizacion-sg
frontend-sg
backend-sg
mongodb-sg
```

## Documentacion

- `docs/arquitectura_gastosmart_segura.md`
- `docs/seguridad_gastosmart_aws.md`
- `docs/monitores_gastosmart.md`
- `docs/pruebas_fallo_gastosmart.md`
- `docs/evidencias_gastosmart.md`
- `docs/monitores.md`
