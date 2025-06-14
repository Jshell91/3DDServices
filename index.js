require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { insertPlayFabPlayerInLevel, testDbConnection, getAllPlayerInLevel, insertPlayerInLevel, countPlayersByLevel, insertArtworkLike, countLikesByArtwork, getLikesByArtworkId, hasUserLikedArtwork } = require('./postgreService');

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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);  
});
