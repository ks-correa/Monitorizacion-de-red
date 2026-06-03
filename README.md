# Proyecto Final - Monitorizacion de Red

Plataforma de monitorizacion desplegada con **Ansible** y **Docker**. El proyecto permite levantar servicios de disponibilidad y metricas en dos escenarios:

1. **AWS EC2**, para exponer un panel de monitorizacion accesible por IP publica.
2. **Entorno local Linux**, para monitorear conectividad y metricas dentro de una red local o comunitaria.

El proyecto integra:

- **Uptime Kuma**, para monitoreo de disponibilidad mediante HTTP, TCP y Ping.
- **Prometheus**, para recoleccion de metricas.
- **Node Exporter**, para exponer metricas del servidor.
- **Grafana**, para visualizar metricas en tableros.

## Servicio seleccionado

- **Servicio:** 7 - Monitorizacion de red
- **Monitor de disponibilidad:** Uptime Kuma
- **Modulo de metricas:** Prometheus + Node Exporter + Grafana
- **Puerto Uptime Kuma:** `3001`
- **Puerto Grafana:** `3000`
- **Puerto Prometheus:** `9090`
- **Puerto Node Exporter:** `9100`

## Arquitectura general

```text
                  +------------------------------+
                  | Usuario / Administrador      |
                  | Navegador web                |
                  +---------------+--------------+
                                  |
                    +-------------+-------------+
                    |                           |
                    | HTTP :3001                | HTTP :3000
                    | Uptime Kuma               | Grafana
                    |                           |
        +-----------v---------------------------v-----------+
        |                                                   |
+-------v----------------+                         +--------v---------------+
| AWS EC2 Ubuntu 22.04   |                         | Servidor local Linux   |
| Docker + Uptime Kuma   |                         | Docker + Uptime Kuma   |
| Prometheus + Grafana   |                         | Prometheus + Grafana   |
| Node Exporter          |                         | Node Exporter          |
| SG 22/3001/3000        |                         | Red local/comunitaria  |
+------------------------+                         +------------------------+
```

## Tecnologias utilizadas

- Ansible
- Docker
- Docker Compose
- AWS EC2
- AWS Security Groups
- Ubuntu / Linux
- SSH
- HTTP, TCP y Ping
- Uptime Kuma
- Prometheus
- Node Exporter
- Grafana

## Estructura del proyecto

```text
.
|-- ansible.cfg
|-- inventory.ini
|-- cloud/
|   |-- iac_aws.yml
|   |-- seguridad_aws.yml
|   |-- desplegar_kuma_aws.yml
|   |-- desplegar_metricas_aws.yml
|   `-- variables_aws.yml
|-- docker/
|   `-- docker-compose.yml
|-- docs/
|   `-- monitores.md
|-- local/
|   |-- desplegar_local.yml
|   |-- desplegar_metricas_local.yml
|   `-- inventory_local.ini
|-- metricas/
|   |-- docker-compose-metricas.yml
|   `-- prometheus.yml
`-- scripts/
    |-- deploy_aws.sh
    |-- deploy_local.sh
    |-- deploy_metricas_aws.sh
    |-- deploy_metricas_local.sh
    |-- destroy_aws.sh
    |-- start_aws.sh
    |-- stop_aws.sh
    |-- update_security_aws.sh
    `-- update_inventory_aws.sh
```

## Requisitos

### Requisitos comunes

- Linux o WSL.
- Ansible instalado.
- Docker disponible en el servidor destino o permisos `sudo` para instalarlo.
- Puerto `3001` disponible para Uptime Kuma.
- Puerto `3000` disponible para Grafana.
- Puertos `9090` y `9100` disponibles si se desea consultar Prometheus o Node Exporter directamente.

### Requisitos para AWS

- Cuenta de AWS con permisos para crear y administrar EC2 y Security Groups.
- AWS CLI configurado con credenciales validas.
- Coleccion de Ansible para AWS:

```bash
ansible-galaxy collection install amazon.aws
```

- Par de llaves SSH existente en AWS con nombre:

```text
monitorizacion-key
```

- Llave privada local en la raiz del proyecto:

```text
monitorizacion-key.pem
```

> Nota: la llave `.pem` no debe subirse al repositorio.

## Configuracion principal

Las variables de AWS se encuentran en:

```text
cloud/variables_aws.yml
```

Valores actuales principales:

```yaml
aws_region: us-east-1
instance_type: t3.small
key_name: monitorizacion-key
key_file: ./monitorizacion-key.pem
security_group_name: monitorizacion-red-sg
instance_name: monitorizacion-red-uptime-kuma
vpc_id: vpc-055c82200f460c027
local_pc_ip: 192.168.0.10
admin_public_cidr: auto
allowed_ssh_cidr: "{{ effective_admin_cidr }}"
allowed_web_cidr: "{{ effective_admin_cidr }}"
allowed_grafana_cidr: "{{ effective_admin_cidr }}"
```

`admin_public_cidr: auto` hace que Ansible detecte la IP publica actual del administrador usando `https://checkip.amazonaws.com` y la convierta en un CIDR `/32`. Esa IP es la que AWS ve desde Internet; la IP privada local, por ejemplo `192.168.0.10`, se conserva solo como referencia de red local.

Durante la configuracion inicial se puede abrir temporalmente con `0.0.0.0/0` para facilitar pruebas. Una vez validado el despliegue, el estado seguro del proyecto limita SSH `22`, Uptime Kuma `3001` y Grafana `3000` al CIDR administrativo detectado o definido manualmente.

## Seguridad y restricciones

El proyecto aplica controles basicos para reducir riesgos durante el despliegue y la administracion de la solucion:

- **Proteccion de llaves privadas y credenciales:** la llave `monitorizacion-key.pem` no se versiona porque esta excluida en `.gitignore`. La clave de Grafana no se deja como `admin/admin`; Ansible genera una clave segura persistente en `.secrets/grafana_admin_password`, directorio que tambien esta excluido de Git, y la copia al servidor mediante `/opt/metricas/.env` con permisos restringidos.
- **Exposicion de puertos:** el Security Group solo permite SSH `22`, Uptime Kuma `3001` y Grafana `3000` desde el CIDR publico administrativo. Prometheus `9090` y Node Exporter `9100` no se abren en el Security Group de AWS.
- **Evitar configuracion manual repetitiva:** los valores principales se centralizan en `cloud/variables_aws.yml`. Los scripts `update_inventory_aws.sh` y `update_security_aws.sh` actualizan automaticamente la IP publica de la instancia y las reglas del Security Group.
- **Uso controlado de interfaces graficas:** la infraestructura y las reglas de red se administran con Ansible y scripts. Las interfaces web de Uptime Kuma y Grafana se usan solo para monitoreo y visualizacion, y su acceso queda limitado por el Security Group.
- **Comprension tecnica de la solucion:** se diferencia entre la IP privada local del administrador, la IP publica administrativa detectada desde Internet y la IP publica de la instancia EC2. Tambien se distingue entre puertos publicados por Docker y puertos realmente expuestos por AWS.

La verificacion SSH se mantiene activa con `host_key_checking = True`. El script `update_inventory_aws.sh` registra la huella de la instancia en `~/.ssh/known_hosts` antes de que Ansible se conecte.

## Despliegue en AWS

El despliegue base en AWS se ejecuta con:

```bash
./scripts/deploy_aws.sh
```

Este script realiza dos fases:

1. Ejecuta `cloud/iac_aws.yml` para crear o actualizar la infraestructura:
   - Busca la AMI mas reciente de Ubuntu Server 22.04.
   - Crea o actualiza el Security Group.
   - Detecta la IP publica administrativa y limita SSH `22`, Uptime Kuma `3001` y Grafana `3000`.
   - Crea la instancia EC2.
   - Genera `inventory.ini` con la IP publica de la instancia.

2. Ejecuta `cloud/desplegar_kuma_aws.yml` para instalar y levantar Uptime Kuma:
   - Espera la conexion SSH.
   - Instala Docker y Docker Compose.
   - Copia `docker/docker-compose.yml` a `/opt/uptime-kuma`.
   - Inicia el contenedor `uptime-kuma`.

Acceso esperado:

```text
http://IP_PUBLICA_AWS:3001
```

## Despliegue de metricas en AWS

Una vez creada y encendida la instancia AWS, el modulo de metricas se despliega con:

```bash
./scripts/deploy_metricas_aws.sh
```

Este script ejecuta `cloud/desplegar_metricas_aws.yml`, que:

- Instala Docker y Docker Compose si es necesario.
- Crea `/opt/metricas`.
- Copia `metricas/docker-compose-metricas.yml`.
- Copia `metricas/prometheus.yml`.
- Genera una clave segura persistente para Grafana en `.secrets/grafana_admin_password`.
- Copia `/opt/metricas/.env` con permisos restringidos.
- Levanta los contenedores `prometheus`, `node-exporter` y `grafana`.

Acceso publico esperado:

```text
Grafana: http://IP_PUBLICA_AWS:3000
```

En la configuracion segura de AWS, Grafana `3000`, Uptime Kuma `3001` y SSH `22` quedan limitados al CIDR administrativo. Prometheus `9090` y Node Exporter `9100` no se abren en el Security Group y quedan pensados principalmente para comunicacion interna entre contenedores o consulta desde la instancia.

Credenciales de Grafana:

```text
Usuario: definido en grafana_admin_user
Clave: generada en .secrets/grafana_admin_password
```

La clave no se guarda en archivos versionados. El directorio `.secrets/` esta excluido por `.gitignore`.

## Administracion de la instancia AWS

Para apagar la instancia sin destruirla:

```bash
./scripts/stop_aws.sh
```

Para encender una instancia detenida:

```bash
./scripts/start_aws.sh
```

Al encenderla, la IP publica puede cambiar. Por eso `start_aws.sh` llama a:

```bash
./scripts/update_inventory_aws.sh
./scripts/update_security_aws.sh
```

Tambien se pueden ejecutar manualmente para regenerar `inventory.ini` con la IP publica actual de la instancia y actualizar el Security Group con la IP publica actual del administrador.

Para actualizar solo las reglas del Security Group sin recrear la instancia:

```bash
./scripts/update_security_aws.sh
```

El inventario ya no desactiva `StrictHostKeyChecking`. `update_inventory_aws.sh` registra la huella SSH actual en `~/.ssh/known_hosts`, y `ansible.cfg` mantiene `host_key_checking = True`.

Para consultar la IP usada por Ansible:

```bash
cat inventory.ini
```

Conexion SSH:

```bash
ssh -i monitorizacion-key.pem ubuntu@IP_PUBLICA_AWS
```

## Despliegue local

El despliegue local usa el inventario:

```text
local/inventory_local.ini
```

Para desplegar Uptime Kuma:

```bash
./scripts/deploy_local.sh
```

Este proceso:

- Instala Docker si no esta instalado.
- Verifica Docker Compose.
- Crea `/opt/uptime-kuma`.
- Copia `docker/docker-compose.yml`.
- Levanta el contenedor `uptime-kuma`.

Acceso desde el mismo equipo:

```text
http://localhost:3001
```

Acceso desde otro equipo de la misma red:

```text
http://IP_DEL_SERVIDOR_LOCAL:3001
```

Para consultar la IP local:

```bash
hostname -I
```

## Despliegue de metricas local

Para desplegar Prometheus, Node Exporter y Grafana en el entorno local:

```bash
./scripts/deploy_metricas_local.sh
```

Este proceso:

- Instala Docker si no esta instalado.
- Verifica Docker Compose.
- Crea `/opt/metricas`.
- Copia la configuracion de metricas.
- Genera o reutiliza la clave segura de Grafana en `.secrets/grafana_admin_password`.
- Levanta `prometheus`, `node-exporter` y `grafana`.

Accesos locales:

```text
Grafana:       http://localhost:3000
Prometheus:    http://localhost:9090
Node Exporter: http://localhost:9100/metrics
```

Credenciales de Grafana:

```text
Usuario: definido en grafana_admin_user
Clave: generada en .secrets/grafana_admin_password
```

## Configuracion de Prometheus

La configuracion esta en:

```text
metricas/prometheus.yml
```

Prometheus recolecta metricas cada 15 segundos:

```yaml
global:
  scrape_interval: 15s
```

Objetivos configurados:

| Job | Target |
|---|---|
| prometheus | `prometheus:9090` |
| node-exporter | `node-exporter:9100` |

## Verificacion del servicio

En el servidor donde se desplegaron los servicios:

```bash
sudo docker ps
```

Contenedores esperados segun el despliegue realizado:

```text
uptime-kuma
prometheus
node-exporter
grafana
```

Logs utiles:

```bash
sudo docker logs uptime-kuma
sudo docker logs prometheus
sudo docker logs node-exporter
sudo docker logs grafana
```

## Monitores recomendados

La guia completa de monitores esta en:

```text
docs/monitores.md
```

Resumen de monitores para AWS:

| Monitor | Tipo | Destino |
|---|---|---|
| Uptime Kuma AWS | HTTP(s) | `http://IP_PUBLICA_AWS:3001` |
| Grafana AWS | HTTP(s) | `http://IP_PUBLICA_AWS:3000` |
| Google DNS | Ping | `8.8.8.8` |
| SSH AWS | TCP Port | `IP_PUBLICA_AWS:22` |
| Sitio Web Externo | HTTP(s) | `https://google.com` |

Resumen de monitores locales:

| Monitor | Tipo | Destino |
|---|---|---|
| Uptime Kuma Local | HTTP(s) | `http://localhost:3001` |
| Grafana Local | HTTP(s) | `http://localhost:3000` |
| Prometheus Local | HTTP(s) | `http://localhost:9090` |
| Node Exporter Local | HTTP(s) | `http://localhost:9100/metrics` |
| Router Local | Ping | `IP_DEL_ROUTER` |
| Internet desde red local | Ping | `8.8.8.8` |
| SSH Servidor Local | TCP Port | `localhost:22` |

Configuracion sugerida:

```text
Heartbeat Interval: 60
Retries: 1
```

## Persistencia de datos

Uptime Kuma conserva usuarios, monitores, configuracion e historial mediante el volumen Docker definido en `docker/docker-compose.yml`:

```yaml
volumes:
  - uptime-kuma-data:/app/data
```

El modulo de metricas conserva datos mediante los volumenes definidos en `metricas/docker-compose-metricas.yml`:

```yaml
volumes:
  prometheus-data:
  grafana-data:
```

Comandos seguros para detener o iniciar contenedores sin borrar datos:

```bash
sudo docker stop uptime-kuma
sudo docker start uptime-kuma
sudo docker stop grafana prometheus node-exporter
sudo docker start grafana prometheus node-exporter
```

Evitar este comando si se quiere conservar la configuracion:

```bash
docker compose down -v
```

La opcion `-v` elimina volumenes y puede borrar datos de Uptime Kuma, Prometheus o Grafana.

## Eliminacion de recursos AWS

Para eliminar la instancia EC2 y el Security Group creados por el proyecto:

```bash
./scripts/destroy_aws.sh
```

El script busca los recursos por:

- Instancia con nombre `monitorizacion-red-uptime-kuma`.
- Security Group `monitorizacion-red-sg`.
- Region `us-east-1`.

## Resultado esperado

Al finalizar el despliegue, se obtiene una plataforma de monitorizacion en Docker con Uptime Kuma para disponibilidad y Grafana/Prometheus/Node Exporter para metricas. La solucion demuestra automatizacion de infraestructura, despliegue de servicios y monitorizacion basica tanto en nube como en red local.
