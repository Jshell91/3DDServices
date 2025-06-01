require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { insertPlayFabPlayerInLevel, testDbConnection, getAllPlayerInLevel, insertPlayerInLevel, countPlayersByLevel } = require('./postgreService');

const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Limitar a 100 peticiones por IP cada 15 minutos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  message: { ok: false, error: 'Demasiadas peticiones, intenta más tarde.' }
});

app.use(limiter);

// Middleware para validar API Key
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

// Endpoint para probar la conexión a PostgreSQL
app.get('/test-db', async (req, res) => {
  try {
    const now = await testDbConnection();
    res.json({ ok: true, now });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para insertar un evento PlayerInLevel en la tabla playfab
app.post('/playfab/PlayerInLevel', async (req, res) => {
  try {
    const data = await insertPlayFabPlayerInLevel(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para obtener todos los registros completos de la tabla player_in_level (playfab)
app.get('/playfab/get-all-players-in-level', async (req, res) => {    
  try {
    const data = await getAllPlayerInLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Nuevo endpoint para insertar en la tabla player_in_level (estructura simple)
app.post('/insert-player-in-level', async (req, res) => {
  try {
    const data = await insertPlayerInLevel(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para obtener todos los registros de la tabla player_in_level
app.get('/get-all-players-in-level', async (req, res) => {
  try {
    const data = await getAllPlayerInLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Endpoint para obtener el recuento de registros agrupados por level_name en player_in_level
app.get('/count-by-level', async (req, res) => {
  try {
    const data = await countPlayersByLevel();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log('API_KEY from env:', JSON.stringify(process.env.API_KEY));
});
