const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { startBot } = require('./main');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Static - supports both /public and /lib/server.html fallback
const publicDir = path.join(__dirname, 'public');
const libHtml = path.join(__dirname, 'lib', 'server.html');

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Global state - synced with main.js
const state = {
  qr: null,           // dataURL
  qrRaw: null,
  pairingCode: null,
  status: 'starting', // starting | connecting | qr | pairing | online | logged-out | reconnecting
  mode: 'pairing',    // pairing | qr
  bot: null,
  commands: new Map(),
  connected: false,
  number: null,
  uptime: Date.now(),
  requestPairingCode: null // will be set by main.js
};

// ============= ROUTES =============

// Main website - try public/index.html first, then lib/server.html
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  if (fs.existsSync(libHtml)) return res.sendFile(libHtml);
  return res.status(404).send('<h1>Baldwin Bot</h1><p>Put your upgraded HTML in /public/index.html or /lib/server.html</p>');
});

// Bot status - for dashboard
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    name: config.BOT_NAME || 'BALDWIN-BOT',
    owner: config.OWNER_NAME || 'Simon tech inc',
    originalNumber: config.ORIGINAL_NUMBER || '09166265317',
    status: state.status,
    mode: state.mode,
    connected: state.status === 'online' || state.connected,
    number: state.number || null,
    qr: state.qr, // dataURL for premium panel
    qrAvailable: Boolean(state.qr),
    code: state.pairingCode,
    pairingCode: state.pairingCode,
    uptime: Math.floor((Date.now() - state.uptime) / 1000),
    commands: state.commands?.size || 0
  });
});

// Legacy support for old panel
app.get('/info', (req, res) => res.redirect('/api/status'));

// Health check for Render / UptimeRobot
app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, status: state.status, uptime: Date.now() - state.uptime });
});

// Raw QR text
app.get('/qr', (req, res) => {
  if (!state.qrRaw) return res.status(404).json({ ok: false, message: 'QR not available' });
  res.type('text/plain').send(state.qrRaw);
});

// QR image file
app.get('/qr-image', (req, res) => {
  const p = path.join(__dirname, 'data', 'qrcode.png');
  if (!fs.existsSync(p)) return res.status(404).json({ ok: false });
  res.sendFile(p);
});

// Switch mode - QR / Pairing
app.post('/api/mode', (req, res) => {
  const { mode } = req.body;
  if (!['qr', 'pairing'].includes(mode)) return res.status(400).json({ ok: false });
  state.mode = mode;
  console.log(`[MODE] Switched to ${mode}`);
  return res.json({ ok: true, mode });
});
app.post('/setmode', (req, res) => {
  state.mode = req.body.mode;
  res.json({ ok: true });
});

// Generate pairing code - PREMIUM LOGIC
app.post('/api/pair', async (req, res) => {
  try {
    let phoneNumber = String(req.body.phoneNumber || req.body.number || '').replace(/\D/g, '');
    
    if (!phoneNumber) return res.status(400).json({ ok: false, message: 'Enter number with country code. Ex: 2349166265317' });
    if (phoneNumber.length < 10 || phoneNumber.length > 15) return res.status(400).json({ ok: false, message: 'Invalid international number' });
    
    if (!state.bot) return res.status(503).json({ ok: false, message: 'Bot starting, wait 5s...' });
    if (state.status === 'online') return res.status(400).json({ ok: false, message: 'Already connected as ' + state.number });

    // Use the function exposed by main.js (best way)
    let code;
    if (typeof state.requestPairingCode === 'function') {
      code = await state.requestPairingCode(phoneNumber);
    } else {
      code = await state.bot.requestPairingCode(phoneNumber);
      state.pairingCode = code;
    }

    state.status = 'pairing';
    console.log(`[PAIR] ${phoneNumber} => ${code}`);

    return res.json({ ok: true, pairingCode: code, code, message: 'Use this code in WhatsApp > Linked devices > Link with phone number' });
  } catch (error) {
    console.error('[PAIR ERROR]', error);
    return res.status(500).json({ ok: false, message: error.message || 'Failed to generate code. Make sure you deleted old session and number is valid.' });
  }
});

// Legacy /pair
app.post('/pair', (req, res) => {
  req.body.phoneNumber = req.body.number;
  return app._router.handle(req, res, () => {}, 'POST', '/api/pair');
});

// ============= START =============

const PORT = Number(process.env.PORT) || config.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════╗
║  BALDWIN BOT - SIMON TECH INC  ║
║  Owner: ${config.OWNER_NAME} - ${config.ORIGINAL_NUMBER} 
║  Web: http://localhost:${PORT}
║  Status API: /api/status
╚════════════════════════════════╝
  `);
});

async function boot() {
  try {
    console.log('[BOOT] Starting Baldwin...');
    await startBot({ state, config });
  } catch (e) {
    state.status = 'error';
    console.error('[BOOT FAIL]', e);
    // auto retry after 5s
    setTimeout(boot, 5000);
  }
}

boot();

process.on('unhandledRejection', e => console.error('[UNHANDLED]', e?.message));
process.on('uncaughtException', e => console.error('[EXCEPTION]', e?.message));
