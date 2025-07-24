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
  hasUserLikedArtwork
  ,
  getAllMaps,
  getMapById,
  insertMap,
  updateMap,
  deleteMap
};

// --- MAPS TABLE FUNCTIONS ---

// Get all maps
async function getAllMaps() {
  const result = await pool.query('SELECT * FROM maps ORDER BY id ASC');
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
  const result = await pool.query(
    `INSERT INTO maps (name, map, codemap, is_single_player, name_in_game, is_online, visible_map_select, views, sponsor, image, max_players)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
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
      map.max_players
    ]
  );
  return result.rows[0];
}

// Update a map by id
async function updateMap(id, map) {
  if (!id) throw new Error('id is required');
  // Only allow updating certain fields
  const fields = ['name', 'map', 'codemap', 'is_single_player', 'name_in_game', 'is_online', 'visible_map_select', 'views', 'sponsor', 'image', 'max_players'];
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
  values.push(id);
  const result = await pool.query(
    `UPDATE maps SET ${set.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

// Delete a map by id
async function deleteMap(id) {
  if (!id) throw new Error('id is required');
  const result = await pool.query('DELETE FROM maps WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}
