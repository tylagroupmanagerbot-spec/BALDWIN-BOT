require('dotenv').config();

module.exports = {
  BOT_NAME: 'Baldwin Bot',
  PREFIX: process.env.PREFIX || '!',
  OWNER_NAME: 'Simon Tech Inc',
  OWNER_NUMBER: '2349166265317',
  OWNER_JID: '2349166265317@s.whatsapp.net',
  SESSION_PATH: './data/auth',
  PORT: Number(process.env.PORT || 3000),
  QR_PATH: './data/qrcode.png',
  PAIRING_MODE: true,
  DEFAULT_LANGUAGE: 'en',
  VERSION: '1.0.0',
  RENDER: !!process.env.RENDER,
  BASE_URL: process.env.BASE_URL || `http://localhost:${Number(process.env.PORT || 3000)}`
};
