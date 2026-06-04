# Arquitectura segura de GastoSmart

## Objetivo

La integracion de GastoSmart permite que el proyecto de monitorizacion supervise una aplicacion distribuida real, compuesta por frontend, backend y base de datos. La arquitectura separa responsabilidades por capa y reduce la exposicion directa de servicios internos.

## Arquitectura distribuida

La solucion en AWS se organiza en cuatro instancias EC2:

| Instancia | Exposicion | Funcion |
| --- | --- | --- |
| Monitorizacion | IP publica restringida por `admin_cidr` | Uptime Kuma, Grafana, Prometheus y Node Exporter |
| Frontend | IP publica | React/Vite servido con Nginx |
| Backend | Sin IP publica | FastAPI en puerto 8000 |
| MongoDB | Sin IP publica | Base de datos en puerto 27017 |

## Flujo principal

```text
Usuario -> Frontend publico -> Nginx reverse proxy -> Backend privado -> MongoDB privado
```

El usuario solo accede al frontend por HTTP. Las solicitudes de la aplicacion hacia `/api` pasan por Nginx y se envian al backend privado. El backend se conecta con MongoDB mediante la red interna de AWS.

## Separacion por capas

El frontend se despliega en una subred publica porque es el punto de entrada de la aplicacion. El backend y MongoDB se despliegan en una subred privada sin IP publica. Esta separacion impide el acceso directo desde Internet a la logica de negocio y a los datos.

La instancia de monitorizacion funciona como punto central para Uptime Kuma y tambien puede actuar como bastion administrativo para acceder a instancias privadas mediante `ProxyJump`.

## Entorno local

Antes del despliegue en AWS, GastoSmart se valida localmente con Docker Compose:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Servicios locales:

| Servicio | Puerto | Funcion |
| --- | --- | --- |
| `gastosmart-frontend` | `8080:80` | Frontend y proxy `/api` |
| `gastosmart-backend` | `8000:8000` | API FastAPI |
| `gastosmart-mongodb` | Interno Docker | Base de datos con volumen persistente |

MongoDB no publica `27017` al host en local; se accede por nombre de servicio Docker: `mongodb://gastosmart-mongodb:27017/gastosmart`.
