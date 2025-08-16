## 13. Online Maps API

La tabla `online_maps` permite registrar mapas abiertos en tiempo real y sus características.

### Estructura principal de la tabla
| Campo           | Tipo      | Descripción                                 |
|-----------------|-----------|---------------------------------------------|
| id              | integer   | Clave primaria                              |
| map_name        | text      | Nombre del mapa                             |
| address         | text      | Dirección IP o DNS del servidor             |
| port            | integer   | Puerto del servidor                         |
| current_players | integer   | Jugadores conectados actualmente            |
| max_players     | integer   | Máximo de jugadores soportados              |
| opened_stamp    | timestamp | Fecha/hora de apertura (por defecto NOW())  |
| status          | text      | Estado ('open' o 'closed')                  |
| closed_stamp    | timestamp | Fecha/hora de cierre (puede ser NULL)       |

### Endpoints

- **GET /online-maps** — Lista todos los mapas online
- **GET /online-maps/:id** — Obtiene un mapa online por id
- **GET /online-maps/search/:name** — Busca mapas online abiertos por nombre (búsqueda parcial, case-insensitive)
- **POST /online-maps** — Crea un nuevo registro de mapa online
- **PUT /online-maps/:id** — Actualiza un registro de mapa online por id
- **DELETE /online-maps/:id** — Elimina un registro de mapa online por id
- **PUT /online-maps/close** — Cierra un mapa online por puerto (IP automática del request)

Todos los endpoints requieren el header `x-api-key`.

#### Ejemplo: Crear un nuevo mapa online
```http
POST /online-maps HTTP/1.1
Host: your-server:3000
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE

{
  "map_name": "Test Online Map",
  "port": 7777,
  "current_players": 0,
  "max_players": 16
}
```
*Nota: El campo `address` ya no es necesario, se usa automáticamente la IP del request.*

#### Ejemplo: Buscar mapas online por nombre
```http
GET /online-maps/survival HTTP/1.1
Host: your-server:3000
x-api-key: YOUR_API_KEY_HERE
```

#### Ejemplo: Cerrar un mapa online
```http
PUT /online-maps/close HTTP/1.1
Host: your-server:3000
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE

{
  "port": 7777
}
```
*Nota: Solo necesitas enviar el puerto, la dirección se obtiene automáticamente del request.*

#### Ejemplo: Respuesta de búsqueda
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "map_name": "Survival Arena",
      "address": "127.0.0.1",
      "port": 7777,
      "current_players": 5,
      "max_players": 16,
      "opened_stamp": "2025-08-09T12:34:56.789Z",
      "status": "open",
      "closed_stamp": null
    }
  ],
  "count": 1,
  "search_term": "survival"
}
```

#### Ejemplo: Respuesta al crear
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "map_name": "Test Online Map",
    "address": "192.168.1.100",
    "port": 7777,
    "current_players": 0,
    "max_players": 16,
    "opened_stamp": "2025-07-28T12:34:56.789Z",
    "status": "open",
    "closed_stamp": null
  }
}
```

---
# 3DDServices

This project is a Node.js web service that receives PlayFab events and stores them in a PostgreSQL database.

## Main Features
- REST API with Express
- Security with Helmet and CORS
- Logging with Morgan
- Environment variables with dotenv
- Insertion and validation of PlayerInLevel events from PlayFab
- PostgreSQL connection

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USER/3DDServices.git
   cd 3DDServices
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your PostgreSQL database configuration:
   ```env
   PGHOST=...
   PGUSER=...
   PGPASSWORD=...
   PGDATABASE=...
   PGPORT=5432
   ```

## Usage
- Start the server:
  ```bash
  node index.js
  ```
- Connection test endpoint:
  - `GET /test-db`  → Returns the current date/time from the database.
- Endpoint to receive PlayFab events:
  - `POST /webhook/PlayerInLevel`  → Inserts an event into the database. The body must be a JSON with the expected structure.
- Endpoint to register a like for an artwork:
  - `POST /artwork/like`  → Inserts a like into the database. The body must be a JSON with the fields `artwork_id` and `user_id`.

### Usage Example

```http
POST /artwork/like HTTP/1.1
Host: your-server:3000
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE

{
  "artwork_id": "artwork123",
  "user_id": "user456"
}
```

## Expected JSON Structure
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

## API Key Authentication

This service requires an API Key to access most endpoints.

- **Required header:** `x-api-key`
- **API Key value:** Define it in the `.env` file (do not share the key publicly).
- **Creation date:** 2025-06-01
- **API version:** 1.0.0

Include the key in all your protected requests, for example:

```http
GET /get-all-players-in-level HTTP/1.1
Host: your-server:3000
x-api-key: YOUR_API_KEY_HERE
```

## Available Endpoints

> All endpoints (except `/`) require API Key authentication via the `x-api-key` header.

### 1. Connection test
- **GET /test-db**
  - Returns the current date/time from the database.
  - Example response:
    ```json
    { "ok": true, "now": "2025-06-07T12:34:56.789Z" }
    ```

### 2. Insert PlayFab PlayerInLevel event
- **POST /playfab/PlayerInLevel**
  - Inserts an event into the `playfab_player_in_level` table.
  - Body: JSON with the expected structure (see example below).
  - Example response:
    ```json
    { "ok": true, "data": { ...record... } }
    ```

### 3. Get all player_in_level records (PlayFab)
- **GET /playfab/get-all-players-in-level**
  - Returns all records from the `player_in_level` table.

### 4. Insert simple record into player_in_level
- **POST /insert-player-in-level**
  - Inserts a simple record into the `player_in_level` table.
  - Body: `{ "EntityId": "...", "LevelName": "..." }`

### 5. Get all player_in_level records
- **GET /get-all-players-in-level**
  - Returns all records from the `player_in_level` table.

### 6. Count players by level
- **GET /count-by-level**
  - Returns the count of records grouped by `level_name` in `player_in_level`.

### 7. Register a like for an artwork
- **POST /artwork/like**
  - Inserts a like into the `artwork_likes` table.
  - Body: `{ "artwork_id": "...", "user_id": "..." }`
  - If the user has already liked that artwork, returns a clear error.

### 8. Count likes by artwork
- **GET /artwork/count-likes**
  - Returns the count of likes grouped by `artwork_id` in the `artwork_likes` table.
  - Example response:
    ```json
    [
      { "artwork_id": "artwork123", "likes": "5" },
      { "artwork_id": "artwork456", "likes": "2" }
    ]
    ```

### 9. Get likes for a specific artwork
- **GET /artwork/likes/:artwork_id**
  - Returns the number of likes for a specific artwork.
  - Example response:
    ```json
    { "ok": true, "artwork_id": "artwork123", "likes": "5" }
    ```

### 10. Root endpoint (no authentication required)
- **GET /**
  - Returns a simple welcome or warning message.

### 11. Check if a user has liked an artwork
- **GET /artwork/has-liked/:artwork_id/:user_id**
  - Returns whether a user has liked a specific artwork.
  - Example response:
    ```json
    { "ok": true, "artwork_id": "artwork123", "user_id": "user456", "liked": true }
    ```


## 12. Maps API

The `maps` table now includes a `max_players` column (integer, NOT NULL, default 50).

### Table Structure (relevant fields)
| Field              | Type      | Description                        |
|--------------------|-----------|------------------------------------|
| id                 | integer   | Primary key                        |
| name               | text      | Map name                           |
| map                | text      | Map identifier                     |
| codemap            | text      | Optional code                      |
| is_single_player   | boolean   | Single player map?                 |
| name_in_game       | text      | Name as shown in game              |
| is_online          | boolean   | Online map?                        |
| visible_map_select | boolean   | Visible in map select?             |
| views              | text      | View count                         |
| sponsor            | text      | Sponsor name                       |
| image              | text      | Image filename                     |
| max_players        | integer   | **Max players supported**          |

### Endpoints

 - **GET /maps** — List all maps where `visible_map_select` is true
- **GET /maps/:id** — Get map by id
- **POST /maps** — Create new map
- **PUT /maps/:id** — Update map by id
- **DELETE /maps/:id** — Delete map by id

All endpoints require the `x-api-key` header.

#### Example: Create a new map
```http
POST /maps HTTP/1.1
Host: your-server:3000
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE

{
  "name": "Test Map",
  "map": "test_map",
  "codemap": "",
  "is_single_player": true,
  "name_in_game": "Test Map",
  "is_online": false,
  "visible_map_select": true,
  "views": "0",
  "sponsor": "TestSponsor",
  "image": "test.png",
  "max_players": 8
}
```

#### Example: Response
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "Test Map",
    "map": "test_map",
    "codemap": "",
    "is_single_player": true,
    "name_in_game": "Test Map",
    "is_online": false,
    "visible_map_select": true,
    "views": "0",
    "sponsor": "TestSponsor",
    "image": "test.png",
    "max_players": 8
  }
}
```

#### Example: Update max_players
```http
PUT /maps/1 HTTP/1.1
Host: your-server:3000
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE

{
  "max_players": 16
}
```

#### Example: Get all maps
```http
GET /maps HTTP/1.1
Host: your-server:3000
x-api-key: YOUR_API_KEY_HERE
```

---

## 14. Odin4Players Voice/Text Chat API

La integración con Odin4Players permite generar tokens para salas de chat de voz y texto en tiempo real.

### ¿Qué es Odin4Players?
Odin4Players es una plataforma de comunicación de voz y texto en tiempo real diseñada específicamente para videojuegos. Permite crear salas de chat persistentes donde los jugadores pueden comunicarse.

### Configuración
- **Variable de entorno requerida**: `ODIN_ACCESS_KEY` en el archivo `.env`
- **Dependencia**: `@4players/odin-tokens`

### Endpoints

- **GET /odin/token** — Genera un token para una sala de chat

Todos los endpoints requieren el header `x-api-key`.

#### Ejemplo: Generar token para sala de chat
```http
GET /odin/token?room_name=general_chat&user_id=player_001&name=PlayerName HTTP/1.1
Host: your-server:3000
x-api-key: YOUR_API_KEY_HERE
```

#### Respuesta exitosa
```json
{
  "token": "eyJhbGciOiJFZERTQSIsImtpZCI6..."
}
```

### Uso con mapas online
Los tokens generados se pueden usar para crear salas de chat específicas. Para mapas online, puedes usar nombres de sala como `map_12345` para identificar cada mapa individual.

---

## Notes
- The `.env` file and `node_modules` folder are excluded from the repository for security and size reasons.
- You can modify the validation and storage logic in `postgreService.js`.

## License
MIT
