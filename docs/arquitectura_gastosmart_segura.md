# Arquitectura segura de GastoSmart

## Objetivo

GastoSmart se integró al proyecto de Monitorización de Red para monitorear una aplicación distribuida real. La aplicación está separada en tres capas: frontend, backend y base de datos. Esta separación permite validar disponibilidad, conectividad entre servicios y fallos reales sin exponer componentes internos.

## Arquitectura local

En local, GastoSmart se ejecuta con Docker Compose desde:

```bash
docker compose -f apps/gastosmart/docker-compose.local.yml up -d --build
```

Los servicios locales comparten la red Docker `gastosmart-net`:

| Servicio | Contenedor | Puerto | Función |
| --- | --- | --- | --- |
| Frontend | `gastosmart-frontend` | `8080:80` | Interfaz React/Vite servida por Nginx. |
| Backend | `gastosmart-backend` | `8000:8000` | API FastAPI con endpoints de salud. |
| MongoDB | `gastosmart-mongodb` | Red interna Docker | Base de datos con volumen persistente. |

El frontend local usa Nginx como reverse proxy. Las solicitudes a `/api` se redirigen al backend, y el backend se conecta a MongoDB mediante:

```text
mongodb://gastosmart-mongodb:27017/gastosmart
```

MongoDB no se publica al host en el `docker-compose.local.yml`; queda disponible dentro de la red Docker.

## Arquitectura en AWS

En AWS, la solución se organiza en cuatro instancias EC2:

| Capa | Instancia | Subred | IP pública | Servicio |
| --- | --- | --- | --- | --- |
| Monitorización | `monitorizacion-red-uptime-kuma` | Pública | Sí | Uptime Kuma, Grafana, Prometheus, Node Exporter y Blackbox Exporter. |
| Frontend | `gastosmart-frontend` | Pública | Sí | Nginx + frontend React/Vite. |
| Backend | `gastosmart-backend` | Privada | No | API FastAPI en el puerto 8000. |
| Base de datos | `gastosmart-mongodb` | Privada | No | MongoDB en el puerto 27017. |

El playbook principal de infraestructura es:

```text
cloud/iac_gastosmart_secure.yml
```

Las variables se centralizan en:

```text
cloud/variables_gastosmart.yml
```

## Flujo de comunicación

```text
Usuario -> Frontend público -> Nginx reverse proxy -> Backend privado -> MongoDB privado
```

El usuario solo accede al frontend por HTTP. El frontend redirige las llamadas `/api` hacia el backend privado. El backend se comunica con MongoDB usando la red privada de AWS.

La base de datos no se monitorea exponiendo `27017`; se valida indirectamente mediante el endpoint `/db-health` del backend.

## Acceso administrativo

El acceso SSH a instancias privadas se realiza mediante salto SSH definido en el inventario `inventories/gastosmart_aws.ini`. El playbook de infraestructura genera el salto usando la instancia de monitorización. El script `scripts/update_inventory_gastosmart.sh` puede regenerar el inventario según las IPs actuales; por eso, el bastión efectivo debe coincidir con las reglas activas de los Security Groups.

## Principio de seguridad

La arquitectura busca que:

- El frontend sea la única capa visible para usuarios.
- El backend no tenga IP pública.
- MongoDB no tenga IP pública.
- MongoDB no acepte tráfico desde Internet.
- Uptime Kuma valide backend y base de datos desde dentro de la VPC.
- Prometheus y Node Exporter no queden abiertos públicamente.
