# Guia de Monitores en Uptime Kuma

Esta guia describe los monitores que se deben crear en Uptime Kuma para validar el funcionamiento del proyecto de **Monitorizacion de Red** en dos escenarios:

1. Entorno cloud sobre AWS EC2.
2. Entorno local sobre Lubuntu o un servidor Linux.

El proyecto ahora combina dos capas:

- **Uptime Kuma**, para verificar disponibilidad de servicios, puertos y conectividad.
- **Prometheus + Node Exporter + Grafana**, para recolectar y visualizar metricas del servidor.

Los monitores de esta guia se crean desde la interfaz web de Uptime Kuma.

---

## 1. Consideraciones generales

La infraestructura y el despliegue del servicio estan automatizados con Ansible y Docker.

La creacion de monitores se realiza desde la interfaz web de Uptime Kuma. Estos monitores quedan guardados gracias al volumen persistente definido en `docker/docker-compose.yml`.

```yaml
volumes:
  - uptime-kuma-data:/app/data
```

Esto permite conservar:

- Usuario administrador.
- Monitores creados.
- Configuracion del sistema.
- Historial de eventos.
- Datos internos de Uptime Kuma.

No se debe usar el siguiente comando si se desea conservar la informacion:

```bash
docker compose down -v
```

La opcion `-v` elimina los volumenes de Docker y puede borrar la configuracion de Uptime Kuma.

---

## 2. Servicios disponibles

### 2.1 Uptime Kuma

Servicio principal para monitoreo de disponibilidad.

```text
Puerto: 3001
Contenedor: uptime-kuma
```

### 2.2 Grafana

Servicio para visualizacion de metricas.

```text
Puerto: 3000
Contenedor: grafana
Usuario: definido en `grafana_admin_user`
Clave: generada en `.secrets/grafana_admin_password`
```

La clave no se almacena en archivos versionados y se copia al servidor mediante `/opt/metricas/.env`.

### 2.3 Prometheus

Servicio para recoleccion y consulta de metricas.

```text
Puerto: 9090
Contenedor: prometheus
```

### 2.4 Node Exporter

Servicio que expone metricas del sistema operativo.

```text
Puerto: 9100
Contenedor: node-exporter
Endpoint: /metrics
```

---

## 3. Obtener la IP publica actual de AWS

La IP publica de AWS no debe dejarse fija en la documentacion, porque puede cambiar si la instancia EC2 se detiene, se enciende o se vuelve a crear.

Para consultar la IP publica actual de la instancia AWS, ejecutar desde la raiz del proyecto:

```bash
cat inventory.ini
```

El archivo debe mostrar algo parecido a:

```ini
[aws]
IP_PUBLICA_AWS ansible_user=ubuntu ansible_ssh_private_key_file=./monitorizacion-key.pem
```

Si la instancia fue encendida de nuevo, actualizar el inventario con:

```bash
./scripts/update_inventory_aws.sh
```

Tambien se puede encender la instancia y actualizar el inventario en un solo paso:

```bash
./scripts/start_aws.sh
```

En esta guia se usara el valor:

```text
IP_PUBLICA_AWS
```

Este valor debe reemplazarse por la IP publica actual de la instancia EC2.

---

## 4. Acceso a los paneles

### 4.1 Acceso en AWS

```text
Uptime Kuma: http://IP_PUBLICA_AWS:3001
Grafana:     http://IP_PUBLICA_AWS:3000
```

Durante la configuracion inicial se puede abrir temporalmente el acceso a `22`, `3001` y `3000` para validar el despliegue. Despues de la configuracion, el Security Group debe quedar limitado al CIDR administrativo definido en `cloud/variables_aws.yml`; si `admin_public_cidr` esta en `auto`, Ansible detecta la IP publica actual del administrador y la aplica como `/32`.

Prometheus `9090` y Node Exporter `9100` existen en el modulo de metricas, pero no estan abiertos publicamente en el Security Group por defecto. Se usan principalmente desde la propia instancia o desde Grafana/Prometheus dentro de la red Docker.

### 4.2 Acceso local

Desde el mismo equipo donde se ejecutan los servicios:

```text
Uptime Kuma:   http://localhost:3001
Grafana:       http://localhost:3000
Prometheus:    http://localhost:9090
Node Exporter: http://localhost:9100/metrics
```

Desde otro equipo conectado a la misma red local:

```text
Uptime Kuma:   http://IP_DEL_SERVIDOR_LOCAL:3001
Grafana:       http://IP_DEL_SERVIDOR_LOCAL:3000
Prometheus:    http://IP_DEL_SERVIDOR_LOCAL:9090
Node Exporter: http://IP_DEL_SERVIDOR_LOCAL:9100/metrics
```

Para conocer la IP local del servidor:

```bash
hostname -I
```

---

## 5. Monitores para AWS

Estos monitores se deben crear dentro del Uptime Kuma desplegado en la instancia EC2 de AWS.

### 5.1 Monitor: Uptime Kuma AWS

#### Proposito

Verificar que la interfaz web de Uptime Kuma desplegada en AWS se encuentra disponible desde Internet.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Uptime Kuma AWS
URL: http://IP_PUBLICA_AWS:3001
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 5.2 Monitor: Grafana AWS

#### Proposito

Verificar que Grafana esta disponible en la instancia AWS.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Grafana AWS
URL: http://IP_PUBLICA_AWS:3000
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 5.3 Monitor: Google DNS

#### Proposito

Validar que la instancia EC2 tiene conectividad hacia Internet.

#### Configuracion

```text
Monitor Type: Ping
Friendly Name: Google DNS
Hostname: 8.8.8.8
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 5.4 Monitor: SSH AWS

#### Proposito

Verificar que el puerto SSH de la instancia EC2 esta disponible. Este puerto es importante porque Ansible lo utiliza para conectarse a la instancia y ejecutar la configuracion remota.

#### Configuracion

```text
Monitor Type: TCP Port
Friendly Name: SSH AWS
Hostname: IP_PUBLICA_AWS
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 5.5 Monitor: Sitio Web Externo

#### Proposito

Validar que la instancia EC2 puede acceder a un servicio web externo mediante HTTP/HTTPS.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Sitio Web Externo
URL: https://google.com
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

---

## 6. Monitores para entorno local

Estos monitores se deben crear dentro del Uptime Kuma desplegado localmente.

### 6.1 Monitor: Uptime Kuma Local

#### Proposito

Verificar que el servicio Uptime Kuma local esta funcionando correctamente.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Uptime Kuma Local
URL: http://localhost:3001
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.2 Monitor: Grafana Local

#### Proposito

Verificar que Grafana local esta disponible.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Grafana Local
URL: http://localhost:3000
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.3 Monitor: Prometheus Local

#### Proposito

Verificar que Prometheus local esta disponible.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Prometheus Local
URL: http://localhost:9090
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.4 Monitor: Node Exporter Local

#### Proposito

Verificar que Node Exporter expone metricas del sistema.

#### Configuracion

```text
Monitor Type: HTTP(s)
Friendly Name: Node Exporter Local
URL: http://localhost:9100/metrics
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.5 Monitor: Router Local

#### Proposito

Verificar que el router o puerta de enlace de la red local responde correctamente.

Para identificar la IP del router local, ejecutar:

```bash
ip route
```

Buscar la linea que empieza con:

```text
default via
```

Ejemplo:

```text
default via 192.168.1.1
```

#### Configuracion

```text
Monitor Type: Ping
Friendly Name: Router Local
Hostname: IP_DEL_ROUTER
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.6 Monitor: Internet desde red local

#### Proposito

Verificar que el servidor local donde se ejecuta Uptime Kuma tiene salida hacia Internet.

#### Configuracion

```text
Monitor Type: Ping
Friendly Name: Internet desde red local
Hostname: 8.8.8.8
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

```text
Up
```

### 6.7 Monitor: SSH Servidor Local

#### Proposito

Verificar si el servidor local tiene disponible el puerto SSH.

#### Configuracion usando localhost

```text
Monitor Type: TCP Port
Friendly Name: SSH Servidor Local
Hostname: localhost
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Configuracion usando IP local

```text
Monitor Type: TCP Port
Friendly Name: SSH Servidor Local
Hostname: IP_DEL_SERVIDOR_LOCAL
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

Si SSH esta instalado y activo:

```text
Up
```

Si SSH no esta instalado o no esta activo, puede aparecer en estado:

```text
Down
```

---

## 7. Tabla resumen de monitores

| Nombre del monitor | Tipo | Entorno | Direccion o host | Proposito |
|---|---|---|---|---|
| Uptime Kuma AWS | HTTP(s) | AWS | `http://IP_PUBLICA_AWS:3001` | Validar acceso web al servicio en AWS |
| Grafana AWS | HTTP(s) | AWS | `http://IP_PUBLICA_AWS:3000` | Validar acceso al panel de metricas en AWS |
| Google DNS | Ping | AWS | `8.8.8.8` | Validar salida a Internet desde AWS |
| SSH AWS | TCP Port | AWS | `IP_PUBLICA_AWS:22` | Validar acceso SSH usado por Ansible |
| Sitio Web Externo | HTTP(s) | AWS | `https://google.com` | Validar conectividad HTTP/HTTPS externa |
| Uptime Kuma Local | HTTP(s) | Local | `http://localhost:3001` | Validar servicio local |
| Grafana Local | HTTP(s) | Local | `http://localhost:3000` | Validar panel local de metricas |
| Prometheus Local | HTTP(s) | Local | `http://localhost:9090` | Validar recoleccion local de metricas |
| Node Exporter Local | HTTP(s) | Local | `http://localhost:9100/metrics` | Validar metricas del sistema local |
| Router Local | Ping | Local | `IP_DEL_ROUTER` | Validar conectividad con la puerta de enlace |
| Internet desde red local | Ping | Local | `8.8.8.8` | Validar salida a Internet desde la red local |
| SSH Servidor Local | TCP Port | Local | `localhost:22` o `IP_DEL_SERVIDOR_LOCAL:22` | Validar acceso SSH local |

---

## 8. Configuracion de Grafana con Prometheus

Despues de desplegar el modulo de metricas, ingresar a Grafana:

```text
http://IP_PUBLICA_AWS:3000
http://localhost:3000
```

Credenciales iniciales:

```text
Usuario: definido en `grafana_admin_user`
Clave: generada en `.secrets/grafana_admin_password`
```

Agregar Prometheus como fuente de datos:

```text
Connection URL: http://prometheus:9090
```

Si se accede desde fuera de Docker o desde el navegador, la URL visible puede ser:

```text
http://localhost:9090
http://IP_DEL_SERVIDOR:9090
```

Para Grafana dentro del mismo `docker-compose-metricas.yml`, la URL recomendada es `http://prometheus:9090`, porque ambos contenedores comparten la red Docker `metricas-net`.

Consultas utiles para probar Prometheus en Grafana:

```promql
up
node_cpu_seconds_total
node_memory_MemAvailable_bytes
node_filesystem_avail_bytes
```

---

## 9. Nota sobre IPs privadas

Las direcciones IP privadas como:

```text
192.168.x.x
10.x.x.x
172.16.x.x - 172.31.x.x
```

solo son accesibles dentro de una red privada o local.

Por esta razon, un Uptime Kuma desplegado en AWS no puede monitorear directamente un router local con IP privada, por ejemplo:

```text
192.168.1.1
```

Ese monitor debe crearse en el Uptime Kuma local, no en el Uptime Kuma desplegado en AWS.

---

## 10. Evidencias recomendadas

Para el informe tecnico se recomienda tomar capturas de:

1. Panel principal de Uptime Kuma en AWS.
2. Monitor `Uptime Kuma AWS` en estado `Up`.
3. Monitor `Grafana AWS` en estado `Up`.
4. Monitor `Google DNS` en estado `Up`.
5. Monitor `SSH AWS` en estado `Up`.
6. Monitor `Sitio Web Externo` en estado `Up`.
7. Panel principal de Grafana en AWS.
8. Fuente de datos Prometheus configurada en Grafana.
9. Panel principal de Uptime Kuma local.
10. Monitor `Uptime Kuma Local` en estado `Up`.
11. Monitor `Grafana Local` en estado `Up`.
12. Monitor `Prometheus Local` en estado `Up`.
13. Monitor `Node Exporter Local` en estado `Up`.
14. Monitor `Router Local` en estado `Up`.
15. Monitor `Internet desde red local` en estado `Up`.
16. Contenedores activos con el comando:

```bash
sudo docker ps
```

---

## 11. Comandos utiles de verificacion

Ver contenedores activos:

```bash
sudo docker ps
```

Ver volumenes Docker:

```bash
sudo docker volume ls
```

Ver la IP local del servidor:

```bash
hostname -I
```

Ver la puerta de enlace local:

```bash
ip route
```

Ver la IP publica actual de AWS desde el inventario:

```bash
cat inventory.ini
```

Actualizar el inventario AWS:

```bash
./scripts/update_inventory_aws.sh
```

Encender la instancia AWS:

```bash
./scripts/start_aws.sh
```

Apagar la instancia AWS:

```bash
./scripts/stop_aws.sh
```

Ver logs de los contenedores:

```bash
sudo docker logs uptime-kuma
sudo docker logs grafana
sudo docker logs prometheus
sudo docker logs node-exporter
```

---

## 12. Conclusiones

La creacion de estos monitores permite demostrar que el sistema de monitorizacion funciona tanto en AWS como en el entorno local.

En AWS se valida el acceso publico a Uptime Kuma, Grafana, SSH y conectividad externa. En el entorno local se valida el funcionamiento de Uptime Kuma, Grafana, Prometheus, Node Exporter, el router local y la salida a Internet.

Esta configuracion demuestra que Uptime Kuma puede utilizarse como una herramienta ligera para disponibilidad, mientras que Prometheus, Node Exporter y Grafana complementan el proyecto con recoleccion y visualizacion de metricas del sistema.
