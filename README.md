# 3DDServices

Este proyecto es un servicio web en Node.js que recibe eventos de PlayFab y los almacena en una base de datos PostgreSQL.

## Características principales
- API REST con Express
- Seguridad con Helmet y CORS
- Registro de logs con Morgan
- Variables de entorno con dotenv
- Inserción y validación de eventos PlayerInLevel desde PlayFab
- Conexión a PostgreSQL

## Instalación
1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/3DDServices.git
   cd 3DDServices
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` con la configuración de tu base de datos PostgreSQL:
   ```env
   PGHOST=...
   PGUSER=...
   PGPASSWORD=...
   PGDATABASE=...
   PGPORT=5432
   ```

## Uso
- Inicia el servidor:
  ```bash
  node index.js
  ```
- Endpoint de prueba de conexión:
  - `GET /test-db`  → Devuelve la fecha/hora actual de la base de datos.
- Endpoint para recibir eventos de PlayFab:
  - `POST /webhook/PlayerInLevel`  → Inserta un evento en la base de datos. El body debe ser un JSON con la estructura esperada.

## Estructura esperada del JSON
```json
{
  "EventName": "PlayerInLevel",
  "Source": "2309A",
  "EntityId": "5537191B437CE8BA",
  "TitleId": "2309A",
  "EventNamespace": "title.2309A",
  "EventId": "0fc383f82c1143c8bf5a81831ba549b3",
  "EntityType": "player",
  "SourceType": "GameClient",
  "Timestamp": "2025-05-20T21:05:19.0000000Z",
  "PlayFabEnvironment": {
    "Vertical": "mainp",
    "Cloud": "main",
    "Application": "mainserver",
    "Commit": "6b84bbc"
  },
  "LevelName": "01_MAINWORLD"
}
```

## Notas
- El archivo `.env` y la carpeta `node_modules` están excluidos del repositorio por seguridad y tamaño.
- Puedes modificar la lógica de validación y almacenamiento en `postgreService.js`.

## Licencia
MIT
