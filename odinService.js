const { TokenGenerator } = require('@4players/odin-tokens');

// Odin Token Generator
const odinGenerator = new TokenGenerator(process.env.ODIN_ACCESS_KEY);

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
  const { room_name: roomName, user_id: userId, name: userName = 'Anonymous' } = params;
  
  if (!roomName || !userId) {
    throw new Error('room_name and user_id are required');
  }
  
  const token = odinGenerator.createToken(roomName, userId);
  console.log(`Generated Odin token for '${userName}' in room '${roomName}'`);
  
  return {
    token: token,
    room_name: roomName,
    user_id: userId,
    user_name: userName,
    generated_at: new Date().toISOString()
  };
}

// Generate token for a specific online map (para endpoint /odin/token/map/:mapId)
function generateOdinTokenForMap(mapId, userId) {
  if (!mapId || !userId) {
    throw new Error('mapId and userId are required');
  }
  
  const roomId = `map_${mapId}`;
  return generateOdinToken(roomId, userId);
}

module.exports = {
  roomGenerate,
  generateOdinTokenStandard,
  generateOdinTokenForMap
};
