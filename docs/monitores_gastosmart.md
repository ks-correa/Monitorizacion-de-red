# Monitores de GastoSmart

## Objetivo

Los monitores de GastoSmart permiten comprobar la disponibilidad de una aplicación distribuida real. La aplicación se valida por capas: frontend público, backend privado y conexión backend-MongoDB.

MongoDB no se monitorea exponiendo el puerto `27017`. Su estado se valida mediante el endpoint `/db-health` del backend.

## Monitores requeridos

| Monitor | Tipo | Objetivo | Justificación |
| --- | --- | --- | --- |
| GastoSmart Frontend | HTTP | `http://IP_PUBLICA_FRONTEND` | Verifica que la capa pública responde. |
| GastoSmart Backend Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/health` | Verifica que el backend privado está activo desde la VPC. |
| GastoSmart DB Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/db-health` | Verifica la conexión real entre backend y MongoDB. |
| GastoSmart MongoDB | Indirecto | `/db-health` | Evita exponer MongoDB a Internet. |
| Grafana | HTTP | `http://localhost:3000` o IP privada de monitorización | Verifica que el panel de métricas está activo. |
| Uptime Kuma | HTTP | `http://localhost:3001` o IP privada de monitorización | Verifica que la herramienta de disponibilidad está activa. |
| SSH Frontend | TCP | `IP_PUBLICA_FRONTEND:22` | Verifica acceso administrativo al frontend si está permitido por `admin_cidr`. |
| SSH Backend | TCP | `IP_PRIVADA_BACKEND:22` | Verifica administración privada si la regla de bastión está habilitada. |
| SSH MongoDB | TCP | `IP_PRIVADA_MONGODB:22` | Verifica administración privada si la regla de bastión está habilitada. |

## Endpoints de salud

`/health` valida que el backend esté vivo:

```json
{
  "status": "ok",
  "service": "gastosmart-backend"
}
```

`/db-health` valida la conectividad con MongoDB:

```json
{
  "status": "ok",
  "database": "mongodb"
}
```

Si MongoDB falla, el backend debe responder algo similar a:

```json
{
  "status": "error",
  "database": "mongodb",
  "detail": "..."
}
```

En este caso el backend devuelve HTTP `503`, por lo que Uptime Kuma puede marcar el monitor como DOWN sin exponer MongoDB.

## Validación manual desde AWS

Desde la instancia de monitorización:

```bash
curl http://IP_PRIVADA_BACKEND:8000/health
curl http://IP_PRIVADA_BACKEND:8000/db-health
```

Desde la instancia frontend:

```bash
curl http://IP_PRIVADA_BACKEND:8000/health
curl http://IP_PRIVADA_BACKEND:8000/db-health
```

Desde el equipo administrador:

```bash
curl http://IP_PUBLICA_FRONTEND
curl http://IP_PUBLICA_FRONTEND/api/health
curl http://IP_PUBLICA_FRONTEND/api/db-health
```

## Automatización

El playbook:

```text
cloud/configurar_monitores_gastosmart.yml
```

genera una especificación documentada en la instancia de monitorización y valida que los objetivos principales respondan desde la VPC.

## Prometheus y Blackbox Exporter

Además de Uptime Kuma, Prometheus usa Blackbox Exporter para consultar:

```text
http://IP_PUBLICA_FRONTEND/
http://IP_PUBLICA_FRONTEND/api/health
http://IP_PUBLICA_FRONTEND/api/db-health
```

Estos objetivos alimentan el dashboard de Grafana `GastoSmart - Monitoreo Distribuido`.
