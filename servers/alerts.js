/**
 * Telegram Alert System for Game Server Monitor
 * Sends notifications when servers go down or become unhealthy
 */

const https = require('https');

// Alert cooldown management (prevents spam)
const alertCooldowns = new Map();
const COOLDOWN_MINUTES = parseInt(process.env.ALERT_COOLDOWN_MINUTES) || 15;

/**
 * Send a message to Telegram
 * @param {string} message - The message to send
 * @returns {Promise<boolean>} - Success status
 */
async function sendTelegramMessage(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('⚠️  Telegram credentials not configured. Skipping alert.');
    return false;
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Telegram alert sent successfully');
          resolve(true);
        } else {
          console.error('❌ Telegram API error:', res.statusCode, responseData);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Failed to send Telegram alert:', error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Check if alert cooldown is active for a server
 * @param {string} serverKey - Unique server identifier (e.g., "01_MAINWORLD:8080")
 * @returns {boolean} - True if cooldown is active (should skip alert)
 */
function isInCooldown(serverKey) {
  const lastAlert = alertCooldowns.get(serverKey);
  if (!lastAlert) return false;

  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  const elapsed = Date.now() - lastAlert;
  
  return elapsed < cooldownMs;
}

/**
 * Set cooldown for a server alert
 * @param {string} serverKey - Unique server identifier
 */
function setCooldown(serverKey) {
  alertCooldowns.set(serverKey, Date.now());
}

/**
 * Send alert when a server goes down
 * @param {Object} server - Server information
 * @param {string} server.name - Server name
 * @param {number} server.port - Server port
 * @param {string} server.status - Current status
 * @param {string} [server.error] - Error message if any
 */
async function sendServerDownAlert(server) {
  const serverKey = `${server.name}:${server.port}`;

  // Check cooldown to prevent spam
  if (isInCooldown(serverKey)) {
    console.log(`⏳ Alert cooldown active for ${serverKey}. Skipping...`);
    return;
  }

  const timestamp = new Date().toLocaleString('es-ES', { 
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const message = `
🚨 <b>SERVIDOR CAÍDO</b> 🚨

<b>Servidor:</b> ${server.name}
<b>Puerto:</b> ${server.port}
<b>Estado:</b> ${server.status}
${server.error ? `<b>Error:</b> ${server.error}` : ''}

<b>Fecha:</b> ${timestamp}

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  const success = await sendTelegramMessage(message);
  
  if (success) {
    setCooldown(serverKey);
  }
}

/**
 * Send alert when a server becomes unhealthy
 * @param {Object} server - Server information
 * @param {string} server.name - Server name
 * @param {number} server.port - Server port
 * @param {number} server.players - Current player count
 * @param {number} server.maxPlayers - Maximum player capacity
 */
async function sendServerUnhealthyAlert(server) {
  const serverKey = `${server.name}:${server.port}:unhealthy`;

  if (isInCooldown(serverKey)) {
    console.log(`⏳ Alert cooldown active for ${serverKey}. Skipping...`);
    return;
  }

  const timestamp = new Date().toLocaleString('es-ES', { 
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const message = `
⚠️ <b>SERVIDOR NO SALUDABLE</b>

<b>Servidor:</b> ${server.name}
<b>Puerto:</b> ${server.port}
<b>Jugadores:</b> ${server.players}/${server.maxPlayers}

<b>Fecha:</b> ${timestamp}

ℹ️ El servidor está en línea pero puede tener problemas.

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  const success = await sendTelegramMessage(message);
  
  if (success) {
    setCooldown(serverKey);
  }
}

/**
 * Send alert when a server recovers
 * @param {Object} server - Server information
 * @param {string} server.name - Server name
 * @param {number} server.port - Server port
 */
async function sendServerRecoveredAlert(server) {
  const serverKey = `${server.name}:${server.port}:recovered`;

  // No cooldown for recovery alerts (always send)
  const timestamp = new Date().toLocaleString('es-ES', { 
    timeZone: 'Europe/Madrid',
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const message = `
✅ <b>SERVIDOR RECUPERADO</b>

<b>Servidor:</b> ${server.name}
<b>Puerto:</b> ${server.port}
<b>Estado:</b> Online

<b>Fecha:</b> ${timestamp}

🎉 El servidor ha vuelto a estar operativo.

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  await sendTelegramMessage(message);
}

/**
 * Send test alert to verify configuration
 */
async function sendTestAlert() {
  const message = `
🧪 <b>TEST DE ALERTAS</b>

✅ La configuración de Telegram está correcta.

<b>Sistema:</b> Game Server Monitor
<b>Cooldown:</b> ${COOLDOWN_MINUTES} minutos
<b>Fecha:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  return await sendTelegramMessage(message);
}

module.exports = {
  sendServerDownAlert,
  sendServerUnhealthyAlert,
  sendServerRecoveredAlert,
  sendTestAlert
};
