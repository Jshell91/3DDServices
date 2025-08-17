const { Pool } = require('pg');

// Connection configuration using environment variables
const pool = new Pool();

// Test connection on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
  } else {
    console.log('Successful connection to PostgreSQL. Date and time:', result.rows[0].now);
  }
});

// Function to insert a PlayerInLevel event
async function insertPlayFabPlayerInLevel(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('The request body is not a valid JSON or is empty.');
  }
//   console.log('Received JSON to insert:', event);

  // Basic validation of required fields
  const requiredFields = [
    'EventName', 'Source', 'EntityId', 'TitleId', 'EventNamespace',
    'EventId', 'EntityType', 'SourceType', 'Timestamp', 'LevelName'
  ];
  for (const field of requiredFields) {
    if (!event[field]) {
      throw new Error(`The required field '${field}' is missing or null.`);
    }
  }
  // Validate that PlayFabEnvironment is an object and has the expected fields
  const env = event.PlayFabEnvironment || {};
  const envFields = ['Vertical', 'Cloud', 'Application', 'Commit'];
  for (const field of envFields) {
    if (!env[field]) {
      throw new Error(`The required field PlayFabEnvironment.${field} is missing or null.`);
    }
  }

  const {
    EventName,
    Source,
    EntityId,
    TitleId,
    EventNamespace,
    EventId,
    EntityType,
    SourceType,
    Timestamp,
    PlayFabEnvironment = {},
    LevelName
  } = event;
  const { Vertical, Cloud, Application, Commit } = PlayFabEnvironment;
  const result = await pool.query(
    `INSERT INTO playfab_player_in_level (
      event_name, source, entity_id, title_id, event_namespace, event_id, entity_type, source_type, timestamp,
      playfab_vertical, playfab_cloud, playfab_application, playfab_commit, level_name
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [
      EventName,
      Source,
      EntityId,
      TitleId,
      EventNamespace,
      EventId,
      EntityType,
      SourceType,
      Timestamp,
      Vertical,
      Cloud,
      Application,
      Commit,
      LevelName
    ]
  );
  return result.rows[0];
}

// Function to insert into the player_in_level table
async function insertPlayerInLevel(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('The request body is not a valid JSON or is empty.');
  }
  const requiredFields = ['EntityId', 'LevelName'];
  for (const field of requiredFields) {
    if (!event[field]) {
      throw new Error(`The required field '${field}' is missing or null.`);
    }
  }
  const result = await pool.query(
    `INSERT INTO player_in_level (entity_id, level_name) VALUES ($1, $2) RETURNING *`,
    [event.EntityId, event.LevelName]
  );
  return result.rows[0];
}

// Function to test the connection (for the /test-db endpoint)
async function testDbConnection() {
  const result = await pool.query('SELECT NOW()');
  return result.rows[0].now;
}

// Function to get all records from the player_in_level table
async function getAllPlayerInLevel() {
  const result = await pool.query('SELECT * FROM player_in_level ORDER BY id DESC');
  return result.rows;
}

// Function to get the count of records grouped by level_name in player_in_level
async function countPlayersByLevel() {
  const result = await pool.query(`
    SELECT level_name, COUNT(*) AS count
    FROM player_in_level
    GROUP BY level_name
    ORDER BY count DESC
  `);
  return result.rows;
}

// Function to insert a like into artwork_likes
async function insertArtworkLike({ artwork_id, user_id }) {
  if (!artwork_id || !user_id) {
    throw new Error("artwork_id and user_id are required");
  }
  try {
    const result = await pool.query(
      `INSERT INTO artwork_likes (artwork_id, user_id) VALUES ($1, $2) RETURNING *`,
      [artwork_id, user_id]
    );
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new Error('The user has already liked this artwork.');
    }
    throw err;
  }
}

// Function to get the count of likes grouped by artwork_id
async function countLikesByArtwork() {
  const result = await pool.query(`
    SELECT artwork_id, COUNT(*) AS likes
    FROM artwork_likes
    GROUP BY artwork_id
    ORDER BY likes DESC
  `);
  return result.rows;
}

// Function to get the number of likes for a single artwork_id
async function getLikesByArtworkId(artwork_id) {
  if (!artwork_id) {
    throw new Error("artwork_id is required");
  }
  const result = await pool.query(
    `SELECT COUNT(*) AS likes FROM artwork_likes WHERE artwork_id = $1`,
    [artwork_id]
  );
  return result.rows[0];
}

// Function to check if a user has liked an artwork_id
async function hasUserLikedArtwork(artwork_id, user_id) {
  if (!artwork_id || !user_id) {
    throw new Error("artwork_id and user_id are required");
  }
  const result = await pool.query(
    `SELECT 1 FROM artwork_likes WHERE artwork_id = $1 AND user_id = $2 LIMIT 1`,
    [artwork_id, user_id]
  );
  return result.rowCount > 0;
}

module.exports = {
  insertPlayFabPlayerInLevel,
  testDbConnection,
  getAllPlayerInLevel,
  insertPlayerInLevel,
  countPlayersByLevel,
  insertArtworkLike,
  countLikesByArtwork,
  getLikesByArtworkId,
  hasUserLikedArtwork,
  getAllMaps,
  getAllMapsAdmin,
  getMapById,
  insertMap,
  updateMap,
  deleteMap,
  getAllOnlineMaps,
  getOnlineMapById,
  insertOnlineMap,
  updateOnlineMap,
  deleteOnlineMap,
  closeOnlineMapByAddressPort,
  getOpenOnlineMapsByName
};
// Cierra un online_map por address y port (status='closed', closed_stamp=now())
async function closeOnlineMapByAddressPort(address, port) {
  if (!address || !port) throw new Error('address and port are required');
  
  // Update the online_map to set status='closed' and closed_stamp=now()
  const result = await pool.query(
    `UPDATE online_maps
     SET status = 'closed', closed_stamp = NOW()
     WHERE address = $1 AND port = $2 AND status = 'open'
     RETURNING *`,
    [address, port]
  );
  if (result.rows.length === 0) {
    throw new Error('No open online_map found with the given address and port.');
  }
  return result.rows[0];
}

// --- MAPS TABLE FUNCTIONS ---

// --- ONLINE_MAPS TABLE FUNCTIONS ---

// Get all online maps
async function getAllOnlineMaps() {
  const result = await pool.query('SELECT * FROM online_maps ORDER BY id ASC');
  return result.rows;
}

// Get online map by id
async function getOnlineMapById(id) {
  if (!id) throw new Error('id is required');
  const result = await pool.query('SELECT * FROM online_maps WHERE id = $1', [id]);
  return result.rows[0];
}

// Get open online maps by name
async function getOpenOnlineMapsByName(mapName) {
  if (!mapName) throw new Error('mapName is required');
  const result = await pool.query(
    'SELECT * FROM online_maps WHERE map_name ILIKE $1 AND status = $2 ORDER BY opened_stamp DESC',
    [`%${mapName}%`, 'open']
  );
  return result.rows;
}

// Insert a new online map
async function insertOnlineMap(req) {
  const requiredFields = ['map_name', 'port']; // address no es requerido, se usa req.ip
  const map = req.body.map || req.body; // Support both body.map and body directly
  for (const field of requiredFields) {
    if (map[field] === undefined || map[field] === null) {
      throw new Error(`The required field '${field}' is missing or null.`);
    }
  }
  try {
    console.log(req.connection.remoteAddress);
    const result = await pool.query(
      `INSERT INTO online_maps (map_name, address, port)
       VALUES ($1, $2, $3) RETURNING *`,
      [
        map.map_name,
        req.connection.remoteAddress, // Siempre usa la IP del request
        map.port,
      ]
    );    
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw new Error('There is already an open map with this address and port.');
    }
    throw err;
  }
}

// Update an online map
async function updateOnlineMap(id, fields) {
  if (!id) throw new Error('id is required');
  const keys = Object.keys(fields);
  if (keys.length === 0) throw new Error('No fields to update.');
  const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...keys.map(k => fields[k])];
  const result = await pool.query(
    `UPDATE online_maps SET ${setClause} WHERE id = $1 RETURNING *`,
    values
  );
  return result.rows[0];
}

// Delete an online map
async function deleteOnlineMap(id) {
  if (!id) throw new Error('id is required');
  const result = await pool.query('DELETE FROM online_maps WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}

// Get all maps (visible only)
async function getAllMaps() {
  const result = await pool.query('SELECT * FROM maps WHERE visible_map_select = true ORDER BY display_order ASC');
  return result.rows;
}

// Get all maps for admin (including invisible)
async function getAllMapsAdmin() {
  const result = await pool.query('SELECT * FROM maps ORDER BY display_order ASC');
  return result.rows;
}

// Get map by id
async function getMapById(id) {
  if (!id) throw new Error('id is required');
  const result = await pool.query('SELECT * FROM maps WHERE id = $1', [id]);
  return result.rows[0];
}

// Insert a new map
async function insertMap(map) {
  const requiredFields = ['name', 'map', 'is_single_player', 'name_in_game', 'is_online', 'visible_map_select', 'views', 'sponsor', 'image', 'max_players'];
  for (const field of requiredFields) {
    if (map[field] === undefined) {
      throw new Error(`The required field '${field}' is missing or null.`);
    }
  }
  
  // Si no se proporciona display_order, usar el siguiente valor disponible
  if (!map.display_order) {
    const maxResult = await pool.query('SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM maps');
    map.display_order = maxResult.rows[0].next_order;
  }
  
  // Validar que display_order sea positivo
  if (map.display_order <= 0) {
    throw new Error('display_order must be greater than 0');
  }
  
  const result = await pool.query(
    `INSERT INTO maps (name, map, codemap, is_single_player, name_in_game, is_online, visible_map_select, views, sponsor, image, max_players, display_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [
      map.name,
      map.map,
      map.codemap || '',
      map.is_single_player,
      map.name_in_game,
      map.is_online,
      map.visible_map_select,
      map.views,
      map.sponsor,
      map.image,
      map.max_players,
      map.display_order
    ]
  );
  return result.rows[0];
}

// Update a map by id
async function updateMap(id, map) {
  if (!id) throw new Error('id is required');
  
  // Validar display_order si se proporciona
  if (map.display_order !== undefined && map.display_order <= 0) {
    throw new Error('display_order must be greater than 0');
  }
  
  // Only allow updating certain fields - REMOVED 'map' field that doesn't exist
  const fields = ['name', 'codemap', 'is_single_player', 'name_in_game', 'is_online', 'visible_map_select', 'views', 'sponsor', 'image', 'max_players', 'display_order'];
  const set = [];
  const values = [];
  let idx = 1;
  for (const field of fields) {
    if (map[field] !== undefined) {
      set.push(`${field} = $${idx}`);
      values.push(map[field]);
      idx++;
    }
  }
  if (set.length === 0) throw new Error('No valid fields to update');
  values.push(parseInt(id)); // Convert ID to integer
  
  const sql = `UPDATE maps SET ${set.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await pool.query(sql, values);
  return result.rows[0];
}

// Delete a map by id
async function deleteMap(id) {
  if (!id) throw new Error('id is required');
  const result = await pool.query('DELETE FROM maps WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}
