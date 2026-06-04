# Seguridad de GastoSmart en AWS

## Principio de minima exposicion

La arquitectura aplica minima exposicion: solo el frontend queda disponible publicamente por HTTP. El backend y MongoDB no tienen IP publica y no aceptan trafico directo desde Internet.

## Security Groups

Los Security Groups se nombran con sufijo `-sg`, evitando nombres que empiecen por `sg-` porque ese prefijo se puede confundir con identificadores internos de AWS.

| Security Group | Reglas de entrada |
| --- | --- |
| `monitorizacion-sg` | TCP 22, 3001 y 3000 solo desde `admin_cidr` |
| `frontend-sg` | TCP 22 desde `admin_cidr`, TCP 80 desde `web_cidr` |
| `backend-sg` | TCP 8000 desde `frontend-sg` y `monitorizacion-sg`; SSH opcional desde `monitorizacion-sg` |
| `mongodb-sg` | TCP 27017 solo desde `backend-sg`; SSH opcional desde `monitorizacion-sg` |

No se abren los puertos 9090 de Prometheus ni 9100 de Node Exporter a Internet. Estos servicios deben quedar disponibles solo dentro de la instancia o red de monitorizacion.

## Backend privado

El backend FastAPI escucha en el puerto 8000, pero el Security Group solo permite acceso desde el frontend y desde la instancia de monitorizacion. Esto permite que el usuario use la API mediante el frontend, sin exponer la API directamente a Internet.

## MongoDB privado

MongoDB se ejecuta en una instancia sin IP publica. El puerto 27017 solo acepta conexiones desde `backend-sg`. La salud de MongoDB se verifica indirectamente mediante `/db-health`, expuesto por el backend, para no abrir la base de datos a monitores publicos.

## Secretos y archivos sensibles

No se deben subir:

- Llaves `.pem`.
- Archivos `.env` reales.
- Contrasenas.
- Credenciales AWS.
- Archivos dentro de `.secrets/`.

El repo principal ya ignora `.pem`, `.env*`, `.secrets/` y credenciales. La integracion agrega solo `.env.example`.

## Docker vs AWS

Publicar un puerto en Docker no equivale a exponerlo publicamente en AWS. Por ejemplo, MongoDB puede estar publicado como `27017:27017` dentro de la instancia privada para que el backend lo alcance por red interna, pero el Security Group impide que Internet llegue a ese puerto.

## Acceso administrativo

El acceso SSH, Grafana y Uptime Kuma se restringen mediante `admin_cidr`. En una entrega final, `admin_cidr` debe ser una IP publica concreta en formato `/32`, no `0.0.0.0/0`.
