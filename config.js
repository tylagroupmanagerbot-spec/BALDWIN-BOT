require('dotenv').config();
const fs = require('fs');

const PORT = Number(process.env.PORT) || 3000;

// Core owner - ALWAYS Simon Tech Inc
const ORIGINAL_NUMBER = '2349166265317';
const OWNER_NUMBER_RAW = String(process.env.OWNER_NUMBER || ORIGINAL_NUMBER).replace(/\D/g, '');
const OWNER_NUMBER = OWNER_NUMBER_RAW || ORIGINAL_NUMBER;

// Support multiple owners via OWNER_NUMBERS=234...,234...
const EXTRA_OWNERS = String(process.env.OWNER_NUMBERS || '').split(',').map(s=>s.replace(/\D/g,'')).filter(Boolean);
const ALL_OWNERS = [...new Set([OWNER_NUMBER, ORIGINAL_NUMBER, ...EXTRA_OWNERS])];

module.exports = {
  // ====== BRANDING - LOCKED ======
  BOT_NAME: process.env.BOT_NAME || 'BALDWIN-BOT',
  BOT_FULL_NAME: 'Baldwin iv x sultan Saladi',
  VERSION: '2.0.0 Premium',
  
  // Owner - Simon Tech Inc
  OWNER_NAME: process.env.OWNER_NAME || 'Simon Tech Inc',
  ORIGINAL_NUMBER: ORIGINAL_NUMBER, // 09166265317
  ORIGINAL_DISPLAY: '09166265317',
  OWNER_NUMBER: OWNER_NUMBER,
  OWNER_JID: `${OWNER_NUMBER}@s.whatsapp.net`,
  OWNER_JIDS: ALL_OWNERS.map(n=>`${n}@s.whatsapp.net`),
  ALL_OWNER_NUMBERS: ALL_OWNERS,

  // ====== COMMANDS ======
  PREFIX: process.env.PREFIX || '.',
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',

  // ====== PATHS ======
  SESSION_PATH: process.env.SESSION_PATH || './data/auth',
  QR_PATH: process.env.QR_PATH || './data/qrcode.png',
  DATA_PATH: './data',

  // ====== MODES ======
  PAIRING_MODE: String(process.env.PAIRING_MODE || 'true').toLowerCase() === 'true',
  QR_MODE: String(process.env.QR_MODE || 'false').toLowerCase() === 'true',
  DEFAULT_MODE: process.env.DEFAULT_MODE || 'pairing', // pairing | qr

  // ====== SERVER ======
  PORT,
  HOST: '0.0.0.0',
  BASE_URL: process.env.BASE_URL || (process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL : `http://localhost:${PORT}`),
  RENDER: Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL),

  // ====== BOT BEHAVIOR ======
  AUTO_READ: String(process.env.AUTO_READ || 'false').toLowerCase() === 'true',
  AUTO_TYPING: String(process.env.AUTO_TYPING || 'true').toLowerCase() === 'true',
  AUTO_BIO: true,
  ANTI_DELETE: String(process.env.ANTI_DELETE || 'false').toLowerCase() === 'true',
  PUBLIC_MODE: String(process.env.PUBLIC_MODE || 'true').toLowerCase() === 'true',

  // ====== SECURITY ======
  SESSION_ENCRYPTION: process.env.SESSION_KEY || null,

  // Helper
  isOwner: (jid) => {
    if(!jid) return false;
    const num = String(jid).replace(/\D/g,'');
    return ALL_OWNERS.some(o => num.includes(o) || jid.includes(o));
  }
};

// Ensure data dir
try { fs.mkdirSync('./data', { recursive: true }); fs.mkdirSync('./data/auth', { recursive: true }); } catch {}
