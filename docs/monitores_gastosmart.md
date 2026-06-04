# Monitores de GastoSmart

| Monitor | Tipo | Objetivo | Justificacion |
| --- | --- | --- | --- |
| GastoSmart Frontend | HTTP | `http://IP_PUBLICA_FRONTEND` | Verifica que la capa publica de la aplicacion responde. |
| GastoSmart Backend Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/health` | Verifica que el backend privado esta activo desde la VPC. |
| GastoSmart DB Health | HTTP | `http://IP_PRIVADA_BACKEND:8000/db-health` | Verifica conexion real entre backend y MongoDB sin exponer la base de datos. |
| GastoSmart MongoDB | Indirecto | `/db-health` | MongoDB no se monitorea publicamente por seguridad. |
| Grafana | HTTP | `http://localhost:3000` | Verifica el panel de metricas desde la instancia de monitorizacion. |
| Uptime Kuma | HTTP | `http://localhost:3001` | Verifica la herramienta de disponibilidad. |
| SSH Frontend | TCP | `IP_PUBLICA_FRONTEND:22` | Verifica acceso administrativo al frontend, restringido por `admin_cidr`. |
| SSH Backend | TCP | `IP_PRIVADA_BACKEND:22` | Verifica administracion privada desde `monitorizacion-sg`, si la regla esta habilitada. |
| SSH MongoDB | TCP | `IP_PRIVADA_MONGODB:22` | Verifica administracion privada desde `monitorizacion-sg`, si la regla esta habilitada. |

Los monitores del backend y de la base de datos deben ejecutarse desde la instancia de monitorizacion, porque esa instancia pertenece a la VPC y tiene permiso para consultar el backend privado.

## Endpoints de salud

`/health` valida que el backend este vivo:

```json
{
  "status": "ok",
  "service": "gastosmart-backend"
}
```

`/db-health` valida conectividad con MongoDB:

```json
{
  "status": "ok",
  "database": "mongodb"
}
```

Si MongoDB falla:

```json
{
  "status": "error",
  "database": "mongodb",
  "detail": "..."
}
```

En este caso el backend devuelve HTTP `503`, por lo que Uptime Kuma puede marcar el monitor como DOWN sin exponer MongoDB.
