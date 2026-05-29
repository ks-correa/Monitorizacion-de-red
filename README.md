# Proyecto Final - Monitorizacion de Red

Plataforma de monitorizacion basada en **Uptime Kuma**, desplegada con **Docker** y automatizada con **Ansible**. El proyecto permite levantar el servicio en dos escenarios:

1. **AWS EC2**, para exponer un panel de monitorizacion accesible por IP publica.
2. **Entorno local Linux**, para monitorear conectividad dentro de una red local o comunitaria.

El objetivo es validar disponibilidad de servicios, nodos, puertos, salida a Internet y acceso SSH desde una interfaz web sencilla.

## Servicio seleccionado

- **Servicio:** 7 - Monitorizacion de red
- **Herramienta:** Uptime Kuma
- **Puerto web:** `3001`
- **Imagen Docker:** `louislam/uptime-kuma:1`

## Arquitectura general

```text
                  +------------------------------+
                  | Usuario / Administrador      |
                  | Navegador web                |
                  +---------------+--------------+
                                  |
                                  | HTTP :3001
                                  |
        +-------------------------+-------------------------+
        |                                                   |
+-------v----------------+                         +--------v---------------+
| AWS EC2 Ubuntu 22.04   |                         | Servidor local Linux   |
| Docker + Uptime Kuma   |                         | Docker + Uptime Kuma   |
| Security Group 22/3001 |                         | Red local/comunitaria  |
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

## Estructura del proyecto

```text
.
|-- ansible.cfg
|-- inventory.ini
|-- cloud/
|   |-- iac_aws.yml
|   |-- desplegar_kuma_aws.yml
|   `-- variables_aws.yml
|-- docker/
|   `-- docker-compose.yml
|-- docs/
|   `-- monitores.md
|-- local/
|   |-- desplegar_local.yml
|   `-- inventory_local.ini
|-- scripts/
|   |-- deploy_aws.sh
|   |-- deploy_local.sh
|   `-- destroy_aws.sh
|-- diagramas/
`-- evidencias/
```

## Requisitos

### Requisitos comunes

- Linux o WSL.
- Ansible instalado.
- Acceso a `sudo` para instalar Docker en el despliegue local.
- Puerto `3001` disponible en el servidor donde se despliegue Uptime Kuma.

### Requisitos para AWS

- Cuenta de AWS con permisos para crear EC2 y Security Groups.
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

> Nota: la llave `.pem` no debe subirse al repositorio. El archivo `.gitignore` ya excluye llaves privadas.

## Configuracion principal

Las variables de AWS se encuentran en:

```text
cloud/variables_aws.yml
```

Valores principales:

```yaml
aws_region: us-east-1
instance_type: t3.micro
key_name: monitorizacion-key
security_group_name: monitorizacion-red-sg
instance_name: monitorizacion-red-uptime-kuma
vpc_id: vpc-055c82200f460c027
allowed_ssh_cidr: 0.0.0.0/0
allowed_web_cidr: 0.0.0.0/0
```

Para un entorno real, se recomienda restringir `allowed_ssh_cidr` y `allowed_web_cidr` a una IP o red conocida.

## Despliegue en AWS

El despliegue completo se ejecuta con:

```bash
./scripts/deploy_aws.sh
```

Este script realiza dos fases:

1. Ejecuta `cloud/iac_aws.yml` para crear la infraestructura:
   - Busca la AMI mas reciente de Ubuntu Server 22.04.
   - Crea o actualiza el Security Group.
   - Crea la instancia EC2.
   - Genera `inventory.ini` con la IP publica de la instancia.

2. Ejecuta `cloud/desplegar_kuma_aws.yml` para instalar y levantar Uptime Kuma:
   - Espera la conexion SSH.
   - Instala Docker y Docker Compose.
   - Copia `docker/docker-compose.yml` a `/opt/uptime-kuma`.
   - Inicia el contenedor.

Cuando finalice, consulta la IP publica generada:

```bash
cat inventory.ini
```

Acceso esperado:

```text
http://IP_PUBLICA_AWS:3001
```

## Despliegue local

El despliegue local usa el inventario:

```text
local/inventory_local.ini
```

Ejecutar:

```bash
./scripts/deploy_local.sh
```

Este proceso:

- Instala Docker si no esta instalado.
- Verifica Docker Compose.
- Crea `/opt/uptime-kuma`.
- Copia el archivo `docker/docker-compose.yml`.
- Levanta el contenedor de Uptime Kuma.

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

## Verificacion del servicio

En el servidor donde se desplego Uptime Kuma:

```bash
sudo docker ps
```

Tambien se puede revisar el archivo Compose usado por el proyecto:

```bash
cat docker/docker-compose.yml
```

El contenedor esperado es:

```text
uptime-kuma
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
| Google DNS | Ping | `8.8.8.8` |
| SSH AWS | TCP Port | `IP_PUBLICA_AWS:22` |
| Sitio Web Externo | HTTP(s) | `https://google.com` |

Resumen de monitores locales:

| Monitor | Tipo | Destino |
|---|---|---|
| Uptime Kuma Local | HTTP(s) | `http://localhost:3001` |
| Router Local | Ping | `IP_DEL_ROUTER` |
| Internet desde red local | Ping | `8.8.8.8` |
| SSH Servidor Local | TCP Port | `localhost:22` |

Configuracion sugerida:

```text
Heartbeat Interval: 60
Retries: 1
```

## Conexion SSH y administracion de Kuma en AWS

Despues de crear los monitores, el administrador puede conectarse por SSH a la instancia EC2 donde esta desplegado Uptime Kuma. Desde la raiz del proyecto se debe ejecutar:

```bash
cd ~/Desktop/Monitorizacion-de-red
ssh -i monitorizacion-key.pem ubuntu@IP_PUBLICA_AWS
```

Si la IP publica actual es `32.199.138.197`, el comando seria:

```bash
ssh -i monitorizacion-key.pem ubuntu@32.199.138.197
```

Una vez dentro de la instancia, se puede verificar que Uptime Kuma este en ejecucion con:

```bash
sudo docker ps
```

Debe aparecer el contenedor:

```text
uptime-kuma
```

Tambien se pueden consultar los logs del contenedor:

```bash
sudo docker logs uptime-kuma
```

Comandos utiles de administracion:

```bash
sudo docker restart uptime-kuma
sudo docker stop uptime-kuma
sudo docker start uptime-kuma
```

El acceso a la interfaz web de Uptime Kuma no se realiza por SSH, sino desde el navegador:

```text
http://IP_PUBLICA_AWS:3001
```

Ejemplo:

```text
http://32.199.138.197:3001
```

Si no se recuerda la IP publica actual, se puede revisar el inventario generado por Ansible:

```bash
cat inventory.ini
```

En ese archivo aparece la IP que Ansible esta usando para conectarse a la instancia.

## Persistencia de datos

Uptime Kuma conserva usuarios, monitores, configuracion e historial mediante el volumen Docker definido en `docker/docker-compose.yml`:

```yaml
volumes:
  - uptime-kuma-data:/app/data
```

Comandos seguros para detener o iniciar sin borrar datos:

```bash
sudo docker stop uptime-kuma
sudo docker start uptime-kuma
```

Evitar este comando si se quiere conservar la configuracion:

```bash
docker compose down -v
```

La opcion `-v` elimina volumenes y puede borrar los datos de Uptime Kuma.

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

Al finalizar el despliegue, se obtiene una instancia de Uptime Kuma funcionando en Docker, accesible por navegador y lista para crear monitores de disponibilidad. La solucion demuestra automatizacion de infraestructura, despliegue de servicios y monitorizacion basica tanto en nube como en red local.
