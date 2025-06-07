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

## Notes
- The `.env` file and `node_modules` folder are excluded from the repository for security and size reasons.
- You can modify the validation and storage logic in `postgreService.js`.

## License
MIT
