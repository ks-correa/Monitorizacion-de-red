# Guía de Monitores en Uptime Kuma

Esta guía describe los monitores que se deben crear en Uptime Kuma para validar el funcionamiento del proyecto de **Monitorización de Red** en dos escenarios:

1. Entorno cloud sobre AWS EC2.
2. Entorno local sobre Lubuntu o un servidor Linux.

Los monitores permiten comprobar la disponibilidad del servicio, la conectividad hacia Internet, el acceso SSH a la instancia cloud y la conectividad básica dentro de la red local.

---

## 1. Consideraciones generales

La infraestructura y el despliegue del servicio están automatizados con Ansible y Docker.

La creación de monitores se realiza desde la interfaz web de Uptime Kuma. Estos monitores quedan guardados gracias al volumen persistente definido en el archivo `docker-compose.yml`.

```yaml
volumes:
  - uptime-kuma-data:/app/data
```

Esto permite conservar:

* Usuario administrador.
* Monitores creados.
* Configuración del sistema.
* Historial de eventos.
* Datos internos de Uptime Kuma.

Por lo tanto, si el contenedor se detiene y se vuelve a iniciar, los monitores no se pierden.

No se debe usar el siguiente comando si se desea conservar la información:

```bash
docker compose down -v
```

La opción `-v` elimina los volúmenes de Docker y puede borrar la configuración de Uptime Kuma.

---

## 2. Obtener la IP pública actual de AWS

La IP pública de AWS no debe dejarse fija en la documentación, porque puede cambiar si la instancia EC2 se elimina y se vuelve a crear.

Para consultar la IP pública actual de la instancia AWS, ejecutar desde la raíz del proyecto:

```bash
cat inventory.ini
```

El archivo debe mostrar algo parecido a:

```ini
[aws]
IP_PUBLICA_AWS ansible_user=ubuntu ansible_ssh_private_key_file=./monitorizacion-key.pem ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

También se puede consultar desde AWS CLI con:

```bash
aws ec2 describe-instances \
  --region us-east-1 \
  --filters "Name=tag:Name,Values=monitorizacion-red-uptime-kuma" "Name=instance-state-name,Values=running" \
  --query "Reservations[*].Instances[*].[InstanceId,PublicIpAddress,State.Name]" \
  --output table
```

En esta guía se usará el valor:

```text
IP_PUBLICA_AWS
```

Este valor debe reemplazarse por la IP pública actual de la instancia EC2.

---

## 3. Acceso a Uptime Kuma

### 3.1 Acceso a Uptime Kuma en AWS

Formato general:

```text
http://IP_PUBLICA_AWS:3001
```

Ejemplo:

```text
http://<IP_PUBLICA_ACTUAL>:3001
```

---

### 3.2 Acceso a Uptime Kuma local

Desde el mismo equipo donde se ejecuta Uptime Kuma:

```text
http://localhost:3001
```

Desde otro equipo conectado a la misma red local:

```text
http://IP_DEL_SERVIDOR_LOCAL:3001
```

Para conocer la IP local del servidor:

```bash
hostname -I
```

---

## 4. Monitores para AWS

Estos monitores se deben crear dentro del Uptime Kuma desplegado en la instancia EC2 de AWS.

---

### 4.1 Monitor: Uptime Kuma AWS

#### Propósito

Verificar que la interfaz web de Uptime Kuma desplegada en AWS se encuentra disponible desde Internet.

#### Configuración

```text
Monitor Type: HTTP(s)
Friendly Name: Uptime Kuma AWS
URL: http://IP_PUBLICA_AWS:3001
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 4.2 Monitor: Google DNS

#### Propósito

Validar que la instancia EC2 tiene conectividad hacia Internet.

#### Configuración

```text
Monitor Type: Ping
Friendly Name: Google DNS
Hostname: 8.8.8.8
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 4.3 Monitor: SSH AWS

#### Propósito

Verificar que el puerto SSH de la instancia EC2 está disponible.

Este puerto es importante porque Ansible lo utiliza para conectarse a la instancia y ejecutar la configuración remota.

#### Configuración

```text
Monitor Type: TCP Port
Friendly Name: SSH AWS
Hostname: IP_PUBLICA_AWS
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 4.4 Monitor: Sitio Web Externo

#### Propósito

Validar que la instancia EC2 puede acceder a un servicio web externo mediante HTTP/HTTPS.

#### Configuración

```text
Monitor Type: HTTP(s)
Friendly Name: Sitio Web Externo
URL: https://google.com
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

## 5. Monitores para entorno local

Estos monitores se deben crear dentro del Uptime Kuma desplegado localmente en Lubuntu o en el servidor Linux de la red local.

---

### 5.1 Monitor: Uptime Kuma Local

#### Propósito

Verificar que el servicio Uptime Kuma local está funcionando correctamente.

#### Configuración

```text
Monitor Type: HTTP(s)
Friendly Name: Uptime Kuma Local
URL: http://localhost:3001
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 5.2 Monitor: Router Local

#### Propósito

Verificar que el router o puerta de enlace de la red local responde correctamente.

Este monitor permite comprobar conectividad básica dentro de la LAN.

Para identificar la IP del router local, ejecutar:

```bash
ip route
```

Buscar la línea que empieza con:

```text
default via
```

Ejemplo:

```text
default via 192.168.1.1
```

#### Configuración

```text
Monitor Type: Ping
Friendly Name: Router Local
Hostname: IP_DEL_ROUTER
Heartbeat Interval: 60
Retries: 1
```

Ejemplo:

```text
Monitor Type: Ping
Friendly Name: Router Local
Hostname: 192.168.1.1
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 5.3 Monitor: Internet desde red local

#### Propósito

Verificar que el servidor local donde se ejecuta Uptime Kuma tiene salida hacia Internet.

#### Configuración

```text
Monitor Type: Ping
Friendly Name: Internet desde red local
Hostname: 8.8.8.8
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

El monitor debe aparecer en estado:

```text
Up
```

#### Evidencia recomendada

Tomar captura del monitor en estado `Up`.

---

### 5.4 Monitor: SSH Servidor Local

#### Propósito

Verificar si el servidor local tiene disponible el puerto SSH.

Este monitor es útil para validar que el servidor local puede ser administrado remotamente mediante Ansible.

#### Configuración usando localhost

```text
Monitor Type: TCP Port
Friendly Name: SSH Servidor Local
Hostname: localhost
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Configuración usando IP local

```text
Monitor Type: TCP Port
Friendly Name: SSH Servidor Local
Hostname: IP_DEL_SERVIDOR_LOCAL
Port: 22
Heartbeat Interval: 60
Retries: 1
```

#### Resultado esperado

Si SSH está instalado y activo, el monitor debe aparecer en estado:

```text
Up
```

Si SSH no está instalado o no está activo, puede aparecer en estado:

```text
Down
```

---

## 6. Tabla resumen de monitores

| Nombre del monitor       | Tipo     | Entorno | Dirección o host                            | Propósito                                    |
| ------------------------ | -------- | ------- | ------------------------------------------- | -------------------------------------------- |
| Uptime Kuma AWS          | HTTP(s)  | AWS     | `http://IP_PUBLICA_AWS:3001`                | Validar acceso web al servicio en AWS        |
| Google DNS               | Ping     | AWS     | `8.8.8.8`                                   | Validar salida a Internet desde AWS          |
| SSH AWS                  | TCP Port | AWS     | `IP_PUBLICA_AWS:22`                         | Validar acceso SSH usado por Ansible         |
| Sitio Web Externo        | HTTP(s)  | AWS     | `https://google.com`                        | Validar conectividad HTTP/HTTPS externa      |
| Uptime Kuma Local        | HTTP(s)  | Local   | `http://localhost:3001`                     | Validar servicio local                       |
| Router Local             | Ping     | Local   | `IP_DEL_ROUTER`                             | Validar conectividad con la puerta de enlace |
| Internet desde red local | Ping     | Local   | `8.8.8.8`                                   | Validar salida a Internet desde la red local |
| SSH Servidor Local       | TCP Port | Local   | `localhost:22` o `IP_DEL_SERVIDOR_LOCAL:22` | Validar acceso SSH local                     |

---

## 7. Nota sobre IPs privadas

Las direcciones IP privadas como:

```text
192.168.x.x
10.x.x.x
172.16.x.x - 172.31.x.x
```

solo son accesibles dentro de una red privada o local.

Por esta razón, un Uptime Kuma desplegado en AWS no puede monitorear directamente un router local con IP privada, por ejemplo:

```text
192.168.1.1
```

Ese monitor debe crearse en el Uptime Kuma local, no en el Uptime Kuma desplegado en AWS.

---

## 8. Evidencias recomendadas

Para el informe técnico se recomienda tomar capturas de:

1. Panel principal de Uptime Kuma en AWS.
2. Monitor `Uptime Kuma AWS` en estado `Up`.
3. Monitor `Google DNS` en estado `Up`.
4. Monitor `SSH AWS` en estado `Up`.
5. Monitor `Sitio Web Externo` en estado `Up`.
6. Panel principal de Uptime Kuma local.
7. Monitor `Uptime Kuma Local` en estado `Up`.
8. Monitor `Router Local` en estado `Up`.
9. Monitor `Internet desde red local` en estado `Up`.
10. Contenedor activo con el comando:

```bash
sudo docker ps
```

---

## 9. Comandos útiles de verificación

Ver contenedores activos:

```bash
sudo docker ps
```

Ver volúmenes Docker:

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

Ver la IP pública actual de AWS desde el inventario:

```bash
cat inventory.ini
```

---

## 10. Conclusión

La creación de estos monitores permite demostrar que el sistema de monitorización funciona tanto en AWS como en el entorno local.

En AWS se valida el acceso público al servicio, el puerto SSH y la conectividad externa. En el entorno local se valida el funcionamiento del servicio, la conectividad con el router y la salida a Internet.

Esta configuración demuestra que Uptime Kuma puede ser utilizado como una herramienta ligera, sencilla y funcional para monitorear servicios, nodos y conectividad en escenarios cloud y redes comunitarias.
