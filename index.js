
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const {
  insertPlayFabPlayerInLevel, testDbConnection, getAllPlayerInLevel, insertPlayerInLevel, countPlayersByLevel,
  insertArtworkLike, countLikesByArtwork, getLikesByArtworkId, hasUserLikedArtwork,
  getAllMaps, getMapById, insertMap, updateMap, deleteMap,
  getAllOnlineMaps, getOnlineMapById, insertOnlineMap, updateOnlineMap, deleteOnlineMap, closeOnlineMapByAddressPort,
  getOpenOnlineMapsByName
} = require('./postgreService');

const { generateOdinToken, generateOdinTokenForMap, roomGenerate } = require('./odinService');

const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Limit to 100 requests per IP every 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP
  message: { ok: false, error: 'Too many requests, try again later.' }
});

app.use(limiter);

// Middleware to validate API Key
function apiKeyAuth(req, res, next) {
  const apiKey = req.get('x-api-key') || req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    res.status(401);
    return res.json({ ok: false, error: 'Unauthorized: Invalid or missing API Key' });
  }
  next();
}

app.use(apiKeyAuth);

app.get('/', (req, res) => {
  res.send("3DDSocialServices, you shouldn't be here.");
});

// Endpoint to test PostgreSQL connection
app.get('/test-db', async (req, res) => {
  try {
    const now = await testDbConnection();
    res.json({ ok: true, now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to insert a PlayerInLevel event into the playfab table
app.post('/playfab/PlayerInLevel', async (req, res) => {
  try {
    const data = await insertPlayFabPlayerInLevel(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to get all records from the player_in_level table (playfab)
app.get('/playfab/get-all-players-in-level', async (req, res) => {    
  try {
    const data = await getAllPlayerInLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// New endpoint to insert into the player_in_level table (simple structure)
app.post('/insert-player-in-level', async (req, res) => {
  try {
    const data = await insertPlayerInLevel(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to get all records from the player_in_level table
app.get('/get-all-players-in-level', async (req, res) => {
  try {
    const data = await getAllPlayerInLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to get the count of records grouped by level_name in player_in_level
app.get('/count-by-level', async (req, res) => {
  try {
    const data = await countPlayersByLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to register a like for an artwork
app.post('/artwork/like', async (req, res) => {
  try {
    const data = await insertArtworkLike(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Endpoint to get the count of likes by artwork
app.get('/artwork/count-likes', async (req, res) => {
  try {
    const data = await countLikesByArtwork();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint to get the number of likes for a single artwork_id
app.get('/artwork/likes/:artwork_id', async (req, res) => {
  try {
    const data = await getLikesByArtworkId(req.params.artwork_id);
    res.json({ ok: true, artwork_id: req.params.artwork_id, likes: data.likes });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Endpoint to check if a user has liked an artwork_id
app.get('/artwork/has-liked/:artwork_id/:user_id', async (req, res) => {
  try {
    const liked = await hasUserLikedArtwork(req.params.artwork_id, req.params.user_id);
    res.json({ ok: true, artwork_id: req.params.artwork_id, user_id: req.params.user_id, liked });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// --- MAPS ENDPOINTS ---
// List all maps
app.get('/maps', async (req, res) => {
  try {
    const data = await getAllMaps();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Get map by id
app.get('/maps/:id', async (req, res) => {
  try {
    const map = await getMapById(req.params.id);
    if (!map) return res.status(404).json({ ok: false, error: 'Map not found' });
    res.json({ ok: true, data: map });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Create new map
app.post('/maps', async (req, res) => {
  try {
    const newMap = await insertMap(req.body);
    res.status(201).json({ ok: true, data: newMap });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Update map
app.put('/maps/:id', async (req, res) => {
  try {
    const updated = await updateMap(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'Map not found' });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Delete map
app.delete('/maps/:id', async (req, res) => {
  try {
    const deleted = await deleteMap(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: 'Map not found' });
    res.json({ ok: true, data: deleted });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});


// --- ONLINE MAPS ENDPOINTS ---
// Endpoint para cerrar un online_map por address y port
app.put('/online-maps/close', async (req, res) => {
  try {
    // console.log(`Closing online_map at address: ${req.connection.remoteAddress}, port: ${req.body.port}`);
    // Validar que req.body existe y tiene el campo port
    if (!req.body || !req.body.port) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Request body must include "port" field' 
      });
    }
    
    const { port } = req.body;
    
    const data = await closeOnlineMapByAddressPort(req.connection.remoteAddress, port);
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/online-maps', async (req, res) => {
  try {
    const data = await getAllOnlineMaps();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Get open online maps by name
app.get('/online-maps/:name', async (req, res) => {
  try {
    const data = await getOpenOnlineMapsByName(req.params.name);
    res.json({ 
      ok: true, 
      data,
      count: data.length,
      search_term: req.params.name
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.get('/online-maps/:id', async (req, res) => {
  try {
    const data = await getOnlineMapById(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Online map not found' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.post('/online-maps', async (req, res) => {
  try {
    // console.log(req.body)
    const data = await insertOnlineMap(req);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.put('/online-maps/:id', async (req, res) => {
  try {
    const data = await updateOnlineMap(req.params.id, req.body);
    if (!data) return res.status(404).json({ ok: false, error: 'Online map not found' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.delete('/online-maps/:id', async (req, res) => {
  try {
    const data = await deleteOnlineMap(req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Online map not found' });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// --- ODIN4PLAYERS ENDPOINTS ---
// Endpoint del server-standalone original
app.post('/odin/token', roomGenerate);


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);  
});
