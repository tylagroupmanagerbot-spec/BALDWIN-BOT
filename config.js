require('dotenv').config();

const PORT = Number(process.env.PORT) || 3000;

const OWNER_NUMBER = String(
  process.env.OWNER_NUMBER || '2349166265317'
).replace(/\D/g, '');

module.exports = {
  // Bot information
  BOT_NAME: process.env.BOT_NAME || 'Baldwin Bot',
  VERSION: '1.0.0',

  // Command settings
  PREFIX: process.env.PREFIX || '!',
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',

  // Owner information
  OWNER_NAME: process.env.OWNER_NAME || 'Simon Tech Inc',
  OWNER_NUMBER,
  OWNER_JID: `${OWNER_NUMBER}@s.whatsapp.net`,

  // WhatsApp authentication
  SESSION_PATH: process.env.SESSION_PATH || './data/auth',
  QR_PATH: process.env.QR_PATH || './data/qrcode.png',

  // Pairing
  PAIRING_MODE:
    String(process.env.PAIRING_MODE || 'true').toLowerCase() === 'true',

  // Server
  PORT,

  // Hosting environment
  RENDER: Boolean(process.env.RENDER),

  // Public URL
  BASE_URL:
    process.env.BASE_URL ||
    `http://localhost:${PORT}`
};
