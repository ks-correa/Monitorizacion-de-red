# Pruebas de fallo y recuperación de GastoSmart

## Objetivo

Estas pruebas demuestran que la monitorización detecta fallos reales en una aplicación distribuida. Se validan tres escenarios: caída del frontend, caída del backend y caída de MongoDB.

Las pruebas pueden ejecutarse en AWS sobre las instancias EC2 o en local mediante el script:

```bash
apps/gastosmart/scripts/probar_fallos_local.sh
```

## Estado esperado antes de probar

Antes de detener servicios, validar:

```bash
curl http://IP_PUBLICA_FRONTEND
curl http://IP_PUBLICA_FRONTEND/api/health
curl http://IP_PUBLICA_FRONTEND/api/db-health
```

En local:

```bash
curl http://localhost:8080
curl http://localhost:8080/api/health
curl http://localhost:8080/api/db-health
```

Los monitores de Uptime Kuma y el dashboard de Grafana deben mostrar las capas principales en estado disponible.

## Prueba 1: caída del backend

En la instancia backend:

```bash
sudo docker stop gastosmart-backend
```

Resultado esperado:

- `GastoSmart Backend Health` queda DOWN en Uptime Kuma.
- `GastoSmart DB Health` también puede quedar DOWN porque depende del backend.
- El frontend puede cargar archivos estáticos, pero las llamadas a la API fallan.
- Blackbox Exporter marca fallo en `/api/health` y `/api/db-health`.

Recuperación:

```bash
sudo docker start gastosmart-backend
```

Validación:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/db-health
```

Resultado esperado:

- `/health` vuelve a responder `status: ok`.
- `/db-health` vuelve a responder `status: ok` si MongoDB está funcionando.
- Uptime Kuma vuelve a mostrar los monitores en UP.

## Prueba 2: caída de MongoDB

En la instancia MongoDB:

```bash
sudo docker stop gastosmart-mongodb
```

Resultado esperado:

- El frontend puede cargar.
- El backend responde `/health`.
- `/db-health` responde `status: error`.
- Uptime Kuma muestra `GastoSmart DB Health` en DOWN.
- Grafana refleja la pérdida de disponibilidad del probe de base de datos.

Recuperación:

```bash
sudo docker start gastosmart-mongodb
```

Resultado esperado:

- `/db-health` vuelve a responder `status: ok`.
- Uptime Kuma vuelve a mostrar `GastoSmart DB Health` en UP.

## Prueba 3: caída del frontend

En la instancia frontend:

```bash
sudo docker stop gastosmart-frontend
```

Resultado esperado:

- `GastoSmart Frontend` queda DOWN en Uptime Kuma.
- El endpoint público `http://IP_PUBLICA_FRONTEND` deja de responder.
- Backend y MongoDB pueden seguir funcionando internamente.

Recuperación:

```bash
sudo docker start gastosmart-frontend
```

Resultado esperado:

- `http://IP_PUBLICA_FRONTEND` vuelve a responder.
- El proxy `/api/health` vuelve a funcionar.
- Uptime Kuma y Grafana vuelven a mostrar disponibilidad del frontend.

## Evidencias recomendadas

Para el informe, capturar:

- Estado UP antes de la prueba.
- Monitor en DOWN durante el fallo.
- Respuesta `curl` fallida o con HTTP `503`.
- Recuperación del servicio.
- Dashboard de Grafana mostrando caída y recuperación.
