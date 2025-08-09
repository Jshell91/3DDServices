const { TokenGenerator } = require('@4players/odin-tokens');

// Odin Token Generator
const odinGenerator = new TokenGenerator(process.env.ODIN_ACCESS_KEY);

// --- ODIN4PLAYERS FUNCTIONS ---

// Función original del server-standalone.js
const roomGenerate = (req, res) => {
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

// Generate a token for Odin voice/text chat (para endpoint /odin/token)
function generateOdinToken(roomId, userId) {
  if (!roomId || !userId) {
    throw new Error('roomId and userId are required');
  }
  
  const token = odinGenerator.createToken(roomId, userId);
  console.log(`Generated Odin token for user '${userId}' in room '${roomId}'`);
  
  return {
    token: token,
    room_id: roomId,
    user_id: userId,
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
  generateOdinToken,
  generateOdinTokenForMap
};
