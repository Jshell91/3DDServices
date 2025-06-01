const { Pool } = require('pg');

// Configuración de la conexión usando variables de entorno
const pool = new Pool();

// Probar la conexión al iniciar
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Error al conectar con PostgreSQL:', err);
  } else {
    console.log('Conexión exitosa a PostgreSQL. Fecha y hora:', result.rows[0].now);
  }
});

// Función para insertar un evento PlayerInLevel
async function insertPlayerInLevel(event) {
  if (!event || typeof event !== 'object') {
    throw new Error('El cuerpo de la petición no es un JSON válido o está vacío.');
  }
  console.log('JSON recibido para insertar:', event);

  // Validación básica de campos obligatorios
  const requiredFields = [
    'EventName', 'Source', 'EntityId', 'TitleId', 'EventNamespace',
    'EventId', 'EntityType', 'SourceType', 'Timestamp', 'LevelName'
  ];
  for (const field of requiredFields) {
    if (!event[field]) {
      throw new Error(`El campo obligatorio '${field}' no está presente o es nulo.`);
    }
  }
  // Validar que PlayFabEnvironment es un objeto y tiene los campos esperados
  const env = event.PlayFabEnvironment || {};
  const envFields = ['Vertical', 'Cloud', 'Application', 'Commit'];
  for (const field of envFields) {
    if (!env[field]) {
      throw new Error(`El campo obligatorio PlayFabEnvironment.${field} no está presente o es nulo.`);
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
    `INSERT INTO player_in_level (
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

// Función para probar la conexión (para el endpoint /test-db)
async function testDbConnection() {
  const result = await pool.query('SELECT NOW()');
  return result.rows[0].now;
}

module.exports = { insertPlayerInLevel, testDbConnection };
