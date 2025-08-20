const { TokenGenerator } = require('@4players/odin-tokens');

// Verificar que la clave de acceso de Odin está configurada
if (!process.env.ODIN_ACCESS_KEY) {
  console.error('❌ ODIN_ACCESS_KEY not found in environment variables');
  throw new Error('ODIN_ACCESS_KEY environment variable is required');
}

// Odin Token Generator
const odinGenerator = new TokenGenerator(process.env.ODIN_ACCESS_KEY);
console.log('✅ Odin service ready');

// --- ODIN4PLAYERS FUNCTIONS ---

// Función original del server-standalone.js
const roomGenerate = (req, res) => {
    // Log manual para simular Morgan
    console.log(`${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
    
    const url = new URL(req.url || '/', `http://${req.headers.host || 'hostname'}`);
    const roomId = url.searchParams.get('room_name') || 'default';
    const userId = url.searchParams.get('user_id') || 'unknown';
    const userName = url.searchParams.get('name') || 'Anonymous';
    const token = odinGenerator.createToken(roomId, userId);
    console.log(`new token for '${userName}' in '${roomId}' `);
    res.statusCode = 200;    
    res.setHeader('content-type', 'application/json');
    res.write(`{ "token": "${token}"}`);
    res.end();
};

// Generate a token for Odin voice/text chat (endpoint estándar de Express)
function generateOdinTokenStandard(params) {
  // Validar que params existe y es un objeto
  if (!params || typeof params !== 'object') {
    throw new Error('Invalid parameters object');
  }
  
  const { room_name: roomName, user_id: userId, name: userName = 'Anonymous' } = params;
  
  // Validación más robusta
  if (!roomName || typeof roomName !== 'string' || roomName.trim() === '') {
    throw new Error('room_name is required and must be a non-empty string');
  }
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new Error('user_id is required and must be a non-empty string');
  }
  
  // Verificar que el generador de tokens está inicializado
  if (!odinGenerator) {
    throw new Error('Odin token generator not initialized - check ODIN_ACCESS_KEY');
  }
  
  try {
    const token = odinGenerator.createToken(roomName.trim(), userId.trim());
    console.log(`🎙️ Odin token generated for user ${userId.trim()} in room ${roomName.trim()}`);
    
    return {
      token: token,
      room_name: roomName.trim(),
      user_id: userId.trim(),
      user_name: userName || 'Anonymous',
      generated_at: new Date().toISOString(),
      success: true
    };
  } catch (error) {
    console.error('❌ Error creating Odin token:', error.message);
    throw new Error(`Failed to generate Odin token: ${error.message}`);
  }
}

// Generate token for a specific online map (para endpoint /odin/token/map/:mapId)
function generateOdinTokenForMap(mapId, userId) {
  if (!mapId || !userId) {
    throw new Error('mapId and userId are required');
  }
  
  const roomName = `map_${mapId}`;
  
  // Reutilizar la función principal con los parámetros correctos
  return generateOdinTokenStandard({
    room_name: roomName,
    user_id: userId,
    name: `MapPlayer_${userId}`
  });
}

module.exports = {
  roomGenerate,
  generateOdinTokenStandard,
  generateOdinTokenForMap
};
