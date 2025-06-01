require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { insertPlayerInLevel, testDbConnection } = require('./postgreService');

const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('¡Hola, mundo! El servicio web está funcionando.');
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

// Endpoint para insertar un evento PlayerInLevel en la tabla player_in_level
app.post('/webhook/PlayerInLevel', async (req, res) => {
  try {
    const data = await insertPlayerInLevel(req.body);
    res.status(201).json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
