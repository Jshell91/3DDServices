/**
 * Telegram Alert System for API/Dashboard
 * Sends notifications when GSM connection is lost
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
        try {
          const response = JSON.parse(responseData);
          if (response.ok) {
            console.log('✅ Telegram alert sent successfully');
            resolve(true);
          } else {
            console.error('❌ Telegram API error:', response.description);
            resolve(false);
          }
        } catch (e) {
          console.error('❌ Failed to parse Telegram response:', e.message);
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
 * Check if an alert is in cooldown period
 * @param {string} key - The alert key (e.g., 'gsm-connection')
 * @returns {boolean} - True if in cooldown
 */
function isInCooldown(key) {
  const lastAlert = alertCooldowns.get(key);
  if (!lastAlert) return false;

  const now = Date.now();
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
  return (now - lastAlert) < cooldownMs;
}

/**
 * Set cooldown for an alert
 * @param {string} key - The alert key
 */
function setCooldown(key) {
  alertCooldowns.set(key, Date.now());
}

/**
 * Send GSM offline alert
 * @param {string} error - The error message
 */
async function sendGSMOfflineAlert(error) {
  const key = 'gsm-connection-lost';
  
  if (isInCooldown(key)) {
    console.log(`⏱️  GSM offline alert in cooldown (${COOLDOWN_MINUTES} min)`);
    return;
  }

  const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  
  const message = `
🚨 <b>GSM DESCONECTADO</b>

El dashboard ha perdido conexión con el Game Server Manager.

<b>Error:</b> ${error}
<b>GSM URL:</b> ${process.env.GSM_API_URL || 'No configurado'}
<b>Fecha:</b> ${timestamp}

⚠️ Los servidores Unreal podrían estar sin monitoreo.

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  const sent = await sendTelegramMessage(message);
  if (sent) {
    setCooldown(key);
  }
}

/**
 * Send GSM reconnected alert
 */
async function sendGSMReconnectedAlert() {
  const timestamp = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  
  const message = `
✅ <b>GSM RECONECTADO</b>

La conexión con el Game Server Manager se ha restablecido.

<b>GSM URL:</b> ${process.env.GSM_API_URL || 'No configurado'}
<b>Fecha:</b> ${timestamp}

🎉 El monitoreo de servidores está activo nuevamente.

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  await sendTelegramMessage(message);
  
  // Clear cooldown after reconnection
  alertCooldowns.delete('gsm-connection-lost');
}

/**
 * Send test alert to verify configuration
 */
async function sendTestAlert() {
  const message = `
🧪 <b>TEST DE ALERTAS - API/DASHBOARD</b>

✅ La configuración de Telegram está correcta.

<b>Sistema:</b> API Dashboard
<b>Cooldown:</b> ${COOLDOWN_MINUTES} minutos
<b>Fecha:</b> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}

🔗 <a href="http://157.230.112.247:3000/dashboard">Ver Dashboard</a>
`.trim();

  return await sendTelegramMessage(message);
}

module.exports = {
  sendGSMOfflineAlert,
  sendGSMReconnectedAlert,
  sendTestAlert
};
