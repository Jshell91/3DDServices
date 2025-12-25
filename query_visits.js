require('dotenv').config();
const { Pool } = require('pg');

// Use environment variables for secure configuration
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT || 5432
});

async function queryVisits() {
  try {
    const result = await pool.query(`
      SELECT 
        pil.id,
        pil.entity_id,
        pil.level_name,
        pil.created_at,
        DATE(pil.created_at) as visit_date
      FROM player_in_level pil
      WHERE DATE(pil.created_at) = '2025-12-11'
      ORDER BY pil.created_at ASC
    `);
    
    console.log('\n=== INFORMACIÓN COMPLETA DE VISITAS - 11 DE DICIEMBRE ===\n');
    console.log(`Total de registros: ${result.rows.length}\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID Visita: ${row.id}`);
      console.log(`   Entity ID: ${row.entity_id}`);
      console.log(`   Mapa: ${row.level_name}`);
      console.log(`   Timestamp: ${row.created_at}`);
      console.log('');
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

queryVisits();
