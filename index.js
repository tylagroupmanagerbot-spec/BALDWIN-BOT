const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const FEATURES_PATH = './data/features.json';
const ADMIN_PIN = process.env.ADMIN_PIN || '0916';

// Logs simulation storage
let logs = [];
function addLog(txt) {
  const line = `[${new Date().toLocaleTimeString()}] ${txt}`;
  logs.push(line);
  if (logs.length > 300) logs.shift();
  console.log(txt);
}

// Ensure data dirs and features file
try { fs.ensureDirSync('./data'); fs.ensureDirSync('./data/auth'); } catch {}
if (!fs.existsSync(FEATURES_PATH)) {
  addLog('📦 Creating 1000 features file...');
  let base = {
    antilink: false, welcome: true, goodbye: true, antidelete: false, antibot: false, antispam: true,
    autostatusview: false, autoread: false, autotyping: true, autorecording: false, autobio: true,
    leveling: true, economy: true, games: true, downloader: true, ai: true, sticker: true, group: true, nsfw: false
  };
  let i = 1;
  while (Object.keys(base).length < 1000) {
    let k = 'feature_' + String(i).padStart(4, '0');
    if (!base[k]) base[k] = i % 7 === 0;
    i++;
    if (Object.keys(base).length >= 1000) break;
    let k2 = 'plugin_' + String(i).padStart(4, '0') + '_enable';
    if (!base[k2]) base[k2] = false;
    i++;
  }
  fs.writeJsonSync(FEATURES_PATH, base, { spaces: 2 });
  addLog('✅ 1000 features initialized');
}

let botStartTime = Date.now();
let currentMode = 'pairing';
let mainModule = null;

// Simulation logs on boot
addLog('🔮 Initializing Baldwin bot');
addLog('📦 Using loga simulation...');
addLog('⏳ Load for one minute...');
(async () => {
  for (let s = 0; s < 5; s++) {
    await new Promise(r => setTimeout(r, 8000));
    addLog(`📥 Loading modules... ${ (s+1)*20 }% (${(s+1)*200}/1000 features)`);
  }
  addLog('🖥️ Using dashboard...');
  addLog('📱 One dashboard getting session');
  addLog('🔳 Two sessions terminal QR code scan');
  addLog('⚙️ Three add features turn on or off');
  addLog('👑 Four admin panel control - PIN required');
  addLog('✅ Dashboard ready - waiting for pairing');
})();

// Start bot
async function bootBot() {
  try {
    addLog('⚡ Starting WhatsApp connection...');
    mainModule = require('./main');
    if (mainModule.startBot) {
      await mainModule.startBot();
      addLog('✅ Baldwin Bot Loaded - Ready for link');
    }
  } catch (e) {
    addLog('❌ Boot error: ' + e.message);
  }
}
bootBot();

// ===== API =====
app.get('/api/status', (req, res) => {
  try {
    const features = fs.readJsonSync(FEATURES_PATH);
    const uptime = Math.floor((Date.now() - botStartTime) / 1000);
    let m = null; try { m = require('./main'); } catch {}
    res.json({
      status: m?.connectionStatus || 'waiting',
      mode: currentMode,
      connected: m?.connectionStatus === 'connected',
      uptime,
      commands: m?.commandsCount || 0,
      number: config.OWNER_NUMBER,
      features,
      qr: m?.getQR?.() || null,
      code: m?.getPairCode?.() || null
    });
  } catch (e) { res.json({ status: 'error', uptime: 0, features: {} }); }
});

app.get('/api/logs', (req, res) => res.json({ logs }));

app.get('/api/features', (req, res) => {
  try { res.json(fs.readJsonSync(FEATURES_PATH)); }
  catch { res.json({}); }
});

app.post('/api/features', (req, res) => {
  const { pin, key, value } = req.body;
  if (pin!== ADMIN_PIN) return res.status(403).json({ error: 'Wrong PIN - Owner only' });
  try {
    const features = fs.readJsonSync(FEATURES_PATH);
    features[key] = value;
    fs.writeJsonSync(FEATURES_PATH, features, { spaces: 2 });
    addLog(`⚙️ Feature ${key} -> ${value? 'ON' : 'OFF'} by owner`);
    res.json({ success: true, features });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/mode', (req, res) => {
  currentMode = req.body.mode || 'pairing';
  addLog(`🔄 Mode switched to ${currentMode}`);
  try {
    const m = require('./main');
    if (currentMode === 'qr' && m.switchToQR) m.switchToQR();
    if (currentMode === 'pairing' && m.switchToPairing) m.switchToPairing();
  } catch {}
  res.json({ mode: currentMode });
});

app.post('/api/pair', async (req, res) => {
  try {
    const phone = String(req.body.phoneNumber || req.body.number || '').replace(/\D/g, '');
    if (!phone) return res.status(400).json({ error: 'Number required' });
    addLog(`📱 Pair request: ${phone} - Dashboard Session 1`);
    const m = require('./main');
    const code = await m.generatePairingCode(phone);
    addLog(`🔑 Code generated: ${code} for ${phone}`);
    res.json({ code, pairingCode: code });
  } catch (e) {
    addLog(`❌ Pair error: ${e.message}`);
    res.status(e.status || 500).json({ error: e.message, message: e.message });
  }
});

// Legacy routes for old frontend compatibility
app.post('/pair', (req, res) => { req.body.phoneNumber = req.body.number; app._router.handle({...req, url: '/api/pair', method: 'POST' }, res, ()=>{}); });
app.get('/info', (req, res) => res.redirect('/api/status'));

app.post('/api/admin/login', (req, res) => {
  if (req.body.pin === ADMIN_PIN) {
    addLog('🔓 Admin panel unlocked by owner');
    res.json({ success: true });
  } else {
    addLog('🚫 Wrong PIN attempt');
    res.status(401).json({ error: 'Invalid PIN' });
  }
});

// Dashboard routes
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html'), err => { if(err) res.sendFile(path.join(__dirname, 'public', 'index.html')); }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Start server
app.listen(config.PORT, config.HOST, () => {
  console.log(`BALDWIN BOT running on ${config.PORT} | PIN ${ADMIN_PIN} | 1000 features`);
  addLog(`🌐 Server running on port ${config.PORT}`);
});
