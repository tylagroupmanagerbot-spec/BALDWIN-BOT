// Render injects ENV directly - dotenv optional
try { require('dotenv').config(); } catch(e){}

const fs = require('fs');

const PORT = Number(process.env.PORT) || 10000;

const ORIGINAL_NUMBER = '2349166265317';
const OWNER_NUMBER_RAW = String(process.env.OWNER_NUMBER || ORIGINAL_NUMBER).replace(/\D/g, '');
const OWNER_NUMBER = OWNER_NUMBER_RAW || ORIGINAL_NUMBER;

const EXTRA_OWNERS = String(process.env.OWNER_NUMBERS || '').split(',').map(s=>s.replace(/\D/g,'')).filter(Boolean);
const ALL_OWNERS = [...new Set([OWNER_NUMBER, ORIGINAL_NUMBER, ...EXTRA_OWNERS])];

module.exports = {
  BOT_NAME: process.env.BOT_NAME || 'BALDWIN-BOT',
  BOT_FULL_NAME: 'Baldwin iv x sultan Saladi',
  VERSION: '2.0.0 Premium - 1000 Features',
  
  OWNER_NAME: process.env.OWNER_NAME || 'Simon Tech Inc',
  ORIGINAL_NUMBER: ORIGINAL_NUMBER,
  ORIGINAL_DISPLAY: '09166265317',
  OWNER_NUMBER: OWNER_NUMBER,
  OWNER_JID: `${OWNER_NUMBER}@s.whatsapp.net`,
  OWNER_JIDS: ALL_OWNERS.map(n=>`${n}@s.whatsapp.net`),
  ALL_OWNER_NUMBERS: ALL_OWNERS,

  PREFIX: process.env.PREFIX || '.',
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',

  SESSION_PATH: process.env.SESSION_PATH || './data/auth',
  QR_PATH: process.env.QR_PATH || './data/qrcode.png',
  DATA_PATH: './data',

  PAIRING_MODE: true,
  QR_MODE: false,
  DEFAULT_MODE: process.env.DEFAULT_MODE || 'pairing',

  PORT,
  HOST: '0.0.0.0',
  BASE_URL: process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
  RENDER: Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL),

  ADMIN_PIN: process.env.ADMIN_PIN || '0916',

  AUTO_READ: false,
  AUTO_TYPING: String(process.env.AUTO_TYPING || 'true') === 'true',
  AUTO_BIO: String(process.env.AUTO_BIO || 'true') === 'true',
  ANTI_DELETE: String(process.env.ANTI_DELETE || 'false') === 'true',
  PUBLIC_MODE: String(process.env.PUBLIC_MODE || 'true') === 'true',

  SESSION_ENCRYPTION: process.env.SESSION_KEY || 'BALDWIN_PREMIUM_2026',

  isOwner: (jid) => {
    if(!jid) return false;
    const num = String(jid).replace(/\D/g,'');
    return ALL_OWNERS.some(o => num.includes(o) || jid.includes(o));
  }
};

try { fs.mkdirSync('./data', { recursive: true }); fs.mkdirSync('./data/auth', { recursive: true }); } catch {}
