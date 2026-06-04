# Pruebas de fallo y recuperacion de GastoSmart

Estas pruebas demuestran que la monitorizacion detecta fallos reales en una aplicacion distribuida.

## Prueba 1: caida del backend

En la instancia backend:

```bash
sudo docker stop gastosmart-backend
```

Resultado esperado:

- Uptime Kuma muestra `GastoSmart Backend Health` en DOWN.
- `GastoSmart DB Health` tambien puede quedar DOWN porque depende del backend.
- El frontend puede cargar archivos estaticos, pero las llamadas API fallan.

Recuperacion:

```bash
sudo docker start gastosmart-backend
```

Resultado esperado:

- `/health` vuelve a responder `status: ok`.
- `/db-health` vuelve a responder `status: ok` si MongoDB esta funcionando.
- Uptime Kuma vuelve a mostrar los monitores en UP.

## Prueba 2: caida de MongoDB

En la instancia MongoDB:

```bash
sudo docker stop gastosmart-mongodb
```

Resultado esperado:

- El frontend puede cargar.
- El backend responde `/health`.
- `/db-health` responde `status: error`.
- Uptime Kuma muestra `GastoSmart DB Health` en DOWN.

Recuperacion:

```bash
sudo docker start gastosmart-mongodb
```

Resultado esperado:

- `/db-health` vuelve a responder `status: ok`.
- Uptime Kuma vuelve a mostrar `GastoSmart DB Health` en UP.

## Prueba 3: caida del frontend

En la instancia frontend:

```bash
sudo docker stop gastosmart-frontend
```

Resultado esperado:

- Uptime Kuma muestra `GastoSmart Frontend` en DOWN.
- El backend y MongoDB pueden seguir UP internamente.

Recuperacion:

```bash
sudo docker start gastosmart-frontend
```

Resultado esperado:

- `http://IP_PUBLICA_FRONTEND` vuelve a responder.
- El proxy `/api/health` vuelve a funcionar.

## Pruebas locales

En local se puede ejecutar:

```bash
apps/gastosmart/scripts/probar_fallos_local.sh
```
