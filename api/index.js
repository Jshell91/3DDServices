
require('dotenv').config();

// Suprimir warning de MemoryStore en desarrollo
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const {
  insertPlayFabPlayerInLevel, testDbConnection, getAllPlayerInLevel, insertPlayerInLevel, countPlayersByLevel,
  insertArtworkLike, countLikesByArtwork, getLikesByArtworkId, hasUserLikedArtwork,
  getAllMaps, getAllMapsAdmin, getMapById, getMapByCode, mapExistsByCode, insertMap, updateMap, deleteMap,
  getAllOnlineMaps, getOnlineMapById, insertOnlineMap, updateOnlineMap, deleteOnlineMap, closeOnlineMapByAddressPort,
  getOpenOnlineMapsByName
} = require('./postgreService');

const odinService = require('./odinService');

const app = express();
const port = process.env.PORT || 3000;

// Configure Express to handle connection issues
app.set('trust proxy', 1); // Trust first proxy
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add keep-alive and timeout settings
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000);
  next();
});

app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP completely for now
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  originAgentCluster: false,
  referrerPolicy: false
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://157.230.112.247:3000',
    'https://157.230.112.247:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration for admin login
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Keep false for HTTP in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Serve static files for dashboard with better caching and error handling
app.use('/dashboard', express.static('public', {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set proper MIME types
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
    // Prevent caching issues
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  }
}));

// Serve favicon with proper handling
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(204).end();
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Add basic server info endpoint
app.get('/api/info', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    ok: true,
    server: '3DDServices',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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

// Routes that don't need API key
app.get('/', (req, res) => {
  res.json({
    message: "3DDSocialServices API",
    version: "1.1.0",
    endpoints: {
      dashboard: "/admin",
      api_docs: "/api/info"
    }
  });
});

// Dashboard endpoint (redirect to dashboard.html)
app.get('/admin', (req, res) => {
  res.redirect('/dashboard/dashboard.html');
});

// Alternative dashboard route
app.get('/dashboard-simple', (req, res) => {
  res.redirect('/dashboard/dashboard-simple.html');
});

// Admin authentication endpoints
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Set in .env file
  
  if (password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ ok: true, message: 'Login successful' });
  } else {
    res.status(401).json({ ok: false, error: 'Invalid password' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ ok: false, error: 'Could not log out' });
    } else {
      res.json({ ok: true, message: 'Logged out successfully' });
    }
  });
});

app.get('/admin/check', (req, res) => {
  res.json({ 
    ok: true, 
    isAuthenticated: !!req.session.isAdmin 
  });
});

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ ok: false, error: 'Admin authentication required' });
  }
}

// Protected admin endpoints for dashboard data
app.get('/admin/api/players', requireAdmin, async (req, res) => {
  try {
    const data = await countPlayersByLevel();
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/admin/api/likes', requireAdmin, async (req, res) => {
  try {
    const data = await countLikesByArtwork();
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/admin/api/maps', requireAdmin, async (req, res) => {
  try {
    const data = await getAllMapsAdmin(); // Use admin function to get ALL maps
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Update a map
app.put('/admin/api/maps/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { name, map, name_in_game, codemap, max_players, is_single_player, is_online, visible_map_select, views, sponsor, image, display_order } = req.body;
    
    // Si solo se actualiza display_order, no validar otros campos
    const isOnlyDisplayOrderUpdate = display_order !== undefined && 
                                   !name && !map && !name_in_game && max_players === undefined &&
                                   !codemap && is_single_player === undefined && is_online === undefined &&
                                   visible_map_select === undefined && views === undefined &&
                                   !sponsor && !image;
    
    // Validate required fields (solo si no es actualización de display_order únicamente)
    if (!isOnlyDisplayOrderUpdate && (!name || !map || !name_in_game || max_players === undefined)) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: name, map, name_in_game, max_players' });
    }
    
    // Validate data types
    if (!isOnlyDisplayOrderUpdate && (isNaN(max_players) || max_players < 1)) {
      return res.status(400).json({ ok: false, error: 'max_players must be a positive number' });
    }
    
    const updateData = {};
    
    // Solo agregar campos si no son undefined/null
    if (name) updateData.name = name.trim();
    if (map) updateData.map = map.trim();
    if (name_in_game) updateData.name_in_game = name_in_game.trim();
    if (max_players !== undefined) updateData.max_players = parseInt(max_players);
    if (is_single_player !== undefined) updateData.is_single_player = Boolean(is_single_player);
    if (is_online !== undefined) updateData.is_online = Boolean(is_online);
    
    // Add optional fields if provided
    if (codemap !== undefined) {
      updateData.codemap = codemap.trim();
    }
    if (visible_map_select !== undefined) {
      updateData.visible_map_select = Boolean(visible_map_select);
    }
    if (views !== undefined) {
      updateData.views = parseInt(views) || 0;
    }
    if (display_order !== undefined) {
      updateData.display_order = parseInt(display_order);
    }
    if (sponsor !== undefined) {
      updateData.sponsor = sponsor.trim();
    }
    if (image !== undefined) {
      updateData.image = image.trim();
    }
    
    const data = await updateMap(id, updateData);
    
    res.json({ ok: true, message: 'Map updated successfully', data });
  } catch (error) {
    console.error('Error updating map:', error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/admin/api/online-maps', requireAdmin, async (req, res) => {
  try {
    const data = await getAllOnlineMaps();
    res.json({ ok: true, data });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/admin/api/stats', requireAdmin, async (req, res) => {
  try {
    const playersData = await countPlayersByLevel();
    const likesData = await countLikesByArtwork();
    const mapsData = await getAllMapsAdmin(); // Use admin function for stats
    const onlineMapsData = await getAllOnlineMaps();
    
    const totalPlayers = playersData.reduce((sum, level) => sum + parseInt(level.count), 0);
    const totalLikes = likesData.reduce((sum, artwork) => sum + parseInt(artwork.likes), 0);
    const totalMaps = mapsData.length;
    const onlineMaps = onlineMapsData.filter(map => map.status === 'open').length;
    
    res.json({
      ok: true,
      stats: {
        totalPlayers,
        totalLikes,
        totalMaps,
        onlineMaps
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Apply API key middleware to all routes EXCEPT dashboard static files and specific routes
app.use((req, res, next) => {
  // Public, no API key required
  const isPublic = (
    req.path.startsWith('/dashboard') ||
    req.path.startsWith('/admin') || // Admin UI/API uses session-based auth
    req.path === '/' ||
    req.path === '/health' ||
    req.path === '/api/info' ||
    req.path === '/dashboard-simple'
  );

  if (isPublic) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 Allowing request to (public): ${req.method} ${req.path}`);
    }
    return next();
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔐 Checking API key for: ${req.method} ${req.path}`);
  }
  return apiKeyAuth(req, res, next);
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

// Check if a map exists by CODE MAP (codemap)
// Requires x-api-key header
// Example: GET /maps/code/ABC123/exists -> { ok: true, exists: true, code: "ABC123" }
app.get('/maps/code/:code/exists', apiKeyAuth, async (req, res) => {
  try {
    const code = (req.params.code || '').trim();
    if (!code) {
      return res.status(400).json({ ok: false, error: 'Missing code parameter' });
    }
    const exists = await mapExistsByCode(code);
    // Optional: include minimal map info if it exists (non-sensitive fields only)
    let data = null;
    if (exists) {
      const map = await getMapByCode(code);
      if (map) {
        const { id, name, codemap, name_in_game, visible_map_select, is_online, max_players, is_single_player } = map;
        const maxPlayersNum = parseInt(max_players, 10) || 0;
        const isSingle = Boolean(is_single_player);
        const isMultiplayer = (!isSingle && maxPlayersNum > 1) || Boolean(is_online);
        data = { id, name, codemap, name_in_game, visible_map_select, is_online, max_players: maxPlayersNum, is_single_player: isSingle, is_multiplayer: isMultiplayer };
      }
    }
    return res.json({ ok: true, code, exists, data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
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
app.post('/maps', requireAdmin, async (req, res) => {
  try {
    const newMap = await insertMap(req.body);
    res.status(201).json({ ok: true, data: newMap });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Update map
app.put('/maps/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await updateMap(req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'Map not found' });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Delete map
app.delete('/maps/:id', requireAdmin, async (req, res) => {
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
    // Validar que req.body existe y tiene el campo port
    if (!req.body || !req.body.port) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Request body must include "port" field' 
      });
    }
    
    const { port, address } = req.body;
    
    // Si no se proporciona address, usar la IP del cliente
    const targetAddress = address || req.connection.remoteAddress;
    
    // console.log(`Closing online_map at address: ${targetAddress}, port: ${port}`);
    
    const data = await closeOnlineMapByAddressPort(targetAddress, port);
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
// Odin token endpoint (POST with JSON body)
app.post('/odin/token', async (req, res) => {
  try {
    // Validar que el body tiene los campos requeridos
    const { room_name, user_id, name } = req.body;
    
    if (!room_name || !user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: room_name and user_id are required' 
      });
    }
    
    const result = await odinService.generateOdinTokenStandard(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error generating Odin token:', error);
    res.status(500).json({ error: 'Error generating Odin token' });
  }
});

// ================================
// GAME SERVER MANAGER INTEGRATION
// ================================
const GSM_API_URL = process.env.GSM_API_URL || 'http://217.154.124.154:3001';
const GSM_API_KEY = process.env.GSM_API_KEY || 'GSM_PROD_2025_9kL3mN8pQ7vR2xZ5wA4tY6uI1oE0';

// GSM Data endpoint for dashboard
app.get('/api/dashboard/gsm-data', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${GSM_API_URL}/dashboard/summary`, {
      headers: { 'X-API-Key': GSM_API_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GSM Data error:', error.message);
    res.status(500).json({ ok: false, error: 'Game Server Manager unavailable' });
  }
});

app.get('/api/dashboard/gsm-health', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${GSM_API_URL}/health`, {
      headers: { 'X-API-Key': GSM_API_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GSM Health error:', error.message);
    res.status(500).json({ ok: false, error: 'Game Server Manager unavailable' });
  }
});

// GSM Proxy Routes - Multiple specific routes instead of wildcard
app.get('/api/gsm/health', async (req, res) => {
  try {
    console.log('=== GSM PROXY DEBUG ===');
    console.log('GSM_API_URL:', GSM_API_URL);
    console.log('GSM_API_KEY:', GSM_API_KEY ? 'SET (length: ' + GSM_API_KEY.length + ')' : 'NOT SET');
    console.log('Request URL:', `${GSM_API_URL}/health`);
    
    const fetch = (await import('node-fetch')).default;
    console.log('Fetch imported successfully');
    
    const headers = { 'X-API-Key': GSM_API_KEY, 'Content-Type': 'application/json' };
    console.log('Headers being sent:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(`${GSM_API_URL}/health`, { headers });
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('=== END DEBUG ===');
    
    res.json(data);
  } catch (error) {
    console.error('=== GSM PROXY ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR ===');
    res.status(500).json({ ok: false, error: 'Game Server Manager unavailable', details: error.message });
  }
});

app.get('/api/gsm/dashboard/summary', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${GSM_API_URL}/dashboard/summary`, {
      headers: { 'X-API-Key': GSM_API_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GSM Proxy error:', error);
    res.status(500).json({ ok: false, error: 'Game Server Manager unavailable', details: error.message });
  }
});

app.get('/api/gsm/servers/status', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${GSM_API_URL}/servers/status`, {
      headers: { 'X-API-Key': GSM_API_KEY, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GSM Proxy error:', error);
    res.status(500).json({ ok: false, error: 'Game Server Manager unavailable', details: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 3DDServices Server started successfully!`);
  console.log(`📊 Server running on: http://0.0.0.0:${port}`);
  console.log(`🎛️  Admin Dashboard: http://0.0.0.0:${port}/admin`);
  console.log(`🔗 API Info: http://0.0.0.0:${port}/api/info`);
  console.log(`💚 Health Check: http://0.0.0.0:${port}/health`);
  console.log(`🎮 GSM Proxy: http://0.0.0.0:${port}/api/gsm/*`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`\n✅ Ready to accept connections...\n`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
}).on('connection', (socket) => {
  // Handle socket connections to prevent reset issues
  socket.setTimeout(30000); // 30 second timeout
  socket.setKeepAlive(true, 1000); // Keep alive every second
});
