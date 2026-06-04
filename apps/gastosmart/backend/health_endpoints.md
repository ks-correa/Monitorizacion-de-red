# Endpoints de salud de GastoSmart

El backend FastAPI expone endpoints de salud para que Uptime Kuma valide la aplicacion distribuida sin exponer MongoDB.

| Endpoint | Objetivo | Respuesta esperada |
| --- | --- | --- |
| `GET /health` | Verifica que el backend esta vivo. | `{"status":"ok","service":"gastosmart-backend"}` |
| `GET /db-health` | Verifica que el backend puede hacer `ping` a MongoDB. | `{"status":"ok","database":"mongodb"}` |
| `GET /api/health` | Version compatible con proxy `/api`. | `{"status":"ok","service":"gastosmart-backend"}` |
| `GET /api/db-health` | Version compatible con proxy `/api`. | `{"status":"ok","database":"mongodb"}` |

Si MongoDB no responde, `/db-health` y `/api/db-health` devuelven HTTP `503`, `status: error` e incluyen el detalle del fallo. Esto permite que Uptime Kuma marque el monitor como DOWN con un monitor HTTP normal.
