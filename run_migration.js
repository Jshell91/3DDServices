const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function runMigration() {
  const pool = new Pool();
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'sql', 'add_display_order_column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Ejecutando migración...');
    
    // Ejecutar la migración
    await pool.query(sqlContent);
    
    console.log('✅ Migración ejecutada correctamente');
    console.log('📊 Verificando resultados...');
    
    // Verificar que la columna se creó correctamente
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'maps' AND column_name = 'display_order'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Columna display_order creada:', result.rows[0]);
    } else {
      console.log('❌ No se encontró la columna display_order');
    }
    
    // Mostrar algunos registros
    const maps = await pool.query('SELECT id, name, display_order FROM maps ORDER BY display_order ASC LIMIT 5');
    console.log('📋 Primeros 5 maps ordenados por display_order:');
    maps.rows.forEach(map => {
      console.log(`  ID: ${map.id}, Name: ${map.name}, Order: ${map.display_order}`);
    });
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    if (error.code) {
      console.error('🔍 Código de error:', error.code);
    }
  } finally {
    await pool.end();
    console.log('📴 Conexión cerrada');
  }
}

runMigration();
