# API Documentation

## Authentication

### Admin Endpoints
All `/admin/api/*` endpoints require admin authentication via session login.

**Login:**
```http
POST /admin/login
Content-Type: application/json

{
  "password": "admin3dd2025!secure"
}
```

### API Key Endpoints
All other endpoints require API key authentication.

**Header:**
```http
x-api-key: 08b9bfdf65f54e49b0b286790786f263b18d3cefcda345b59f6295ee9a746ec2
```

## Maps API

### Get All Maps (Admin)
```http
GET /admin/api/maps
Authorization: Admin Session Required
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "name": "Main Arena",
      "map": "Main Arena",
      "name_in_game": "arena_main_v2",
      "codemap": "AM01",
      "max_players": 8,
      "is_single_player": false,
      "is_online": true,
      "visible_map_select": true,
      "views": 156,
      "display_order": 1,
      "sponsor": "GameStudio",
      "image": "https://example.com/arena.jpg"
    }
  ]
}
```

### Create Map
```http
POST /maps
Content-Type: application/json
Authorization: Admin Session Required

{
  "name": "New Arena",
  "map": "New Arena", 
  "name_in_game": "new_arena_v1",
  "max_players": 4,
  "display_order": 10,
  "is_single_player": false,
  "is_online": true,
  "visible_map_select": true,
  "views": 0,
  "codemap": "NA01",
  "sponsor": "",
  "image": ""
}
```

### Update Map
```http
PUT /admin/api/maps/:id
Content-Type: application/json
Authorization: Admin Session Required

{
  "name": "Updated Arena Name",
  "map": "Updated Arena Name",
  "name_in_game": "updated_arena_v2",
  "max_players": 6,
  "display_order": 5
}
```

### Delete Map
```http
DELETE /maps/:id
Authorization: Admin Session Required
```

## Odin Voice Chat API

### Generate Token
```http
POST /odin/token
Content-Type: application/json
x-api-key: [API_KEY]

{
  "roomName": "game_room_1",
  "userId": "player_123"
}
```

**Response:**
```json
{
  "ok": true,
  "token": "odin_token_here",
  "roomName": "game_room_1",
  "userId": "player_123"
}
```

## Players API

### Get All Players (Admin)
```http
GET /admin/api/players
Authorization: Admin Session Required
```

### Insert Player in Level
```http
POST /playerInLevel
Content-Type: application/json
x-api-key: [API_KEY]

{
  "user_id": "player_123",
  "level_name": "level_1",
  "additional_data": {}
}
```

## Online Maps API

### Get Online Maps (Admin)
```http
GET /admin/api/online-maps
Authorization: Admin Session Required
```

### Create Online Map Session
```http
POST /online-maps
Content-Type: application/json
x-api-key: [API_KEY]

{
  "map_name": "arena_main_v2",
  "address": "192.168.1.100",
  "port": 7777,
  "max_players": 8,
  "current_players": 0
}
```

### Close Online Map Session
```http
PUT /online-maps/close
Content-Type: application/json
x-api-key: [API_KEY]

{
  "port": 7777
}
```

## Health & Info

### Health Check
```http
GET /health
```

### API Info
```http
GET /api/info
```

### Test Database
```http
GET /test-db
x-api-key: [API_KEY]
```

## Error Responses

### 401 Unauthorized
```json
{
  "ok": false,
  "error": "Unauthorized: Invalid or missing API Key"
}
```

### 400 Bad Request
```json
{
  "ok": false,
  "error": "Missing required fields: name, map, name_in_game, max_players"
}
```

### 500 Internal Server Error
```json
{
  "ok": false,
  "error": "Database connection failed"
}
```
