const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const fsExtra = require('fs-extra');

const loadCommands = require('./lib/commandLoader');

let reconnectTimer = null;
let globalState = { status: 'waiting', mode: 'pairing', commands: new Map(), qr: null, pairingCode: null, number: null, connected: false };
let botInstance = null;

const FEATURES_PATH = path.join(__dirname, 'data', 'features.json');
function getFeatures() {
  try { return fsExtra.readJsonSync(FEATURES_PATH); } catch { return {}; }
}

process.on('uncaughtException', (e) => console.log('[ANTICRASH] Uncaught:', e.message));
process.on('unhandledRejection', (e) => console.log('[ANTICRASH] Rejection:', e?.message || e));

async function startBot() {
  const config = require('./config');
  const authDir = path.resolve(__dirname, 'data', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(path.resolve(__dirname, 'data'), { recursive: true });

  globalState.status = 'connecting';
  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const logger = pino({ level: 'silent' });

  const bot = makeWASocket({
    version, logger,
    auth: { creds: authState.creds, keys: makeCacheableSignalKeyStore(authState.keys, logger) },
    browser: Browsers.ubuntu(config.BOT_NAME || 'BALDWIN-BOT'),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async () => undefined
  });

  botInstance = bot;
  globalState.bot = bot;

  try {
    const cmdPath = path.join(__dirname, 'commands');
    if (!fs.existsSync(cmdPath)) fs.mkdirSync(cmdPath, { recursive: true });
    globalState.commands = loadCommands(cmdPath);
    console.log(`[BALDWIN] Loaded ${globalState.commands.size} commands`);
  } catch (e) {
    console.error('[BALDWIN] Command load fail:', e);
    globalState.commands = new Map();
  }

  bot.ev.on('creds.update', saveCreds);

  globalState.requestPairingCode = async (phoneNumber) => {
    try {
      let num = String(phoneNumber).replace(/\D/g, '');
      if (!num) throw new Error('Invalid number');
      if (num.length < 10) throw new Error('Number too short, use country code');

      if (authState.creds.registered) {
        console.log('[PAIR] Already registered, cleaning...');
        fs.rmSync(authDir, { recursive: true, force: true });
        throw Object.assign(new Error('Old session removed. Wait 3 sec and Generate again'), { status: 409 });
      }

      let tries = 0;
      while (!bot.ws || bot.ws.readyState!== 1) {
        if (tries++ > 10) break;
        await new Promise(r => setTimeout(r, 500));
      }

      const code = await bot.requestPairingCode(num);
      globalState.pairingCode = code;
      globalState.status = 'pairing';
      console.log(`[PAIR] ✅ Code for ${num}: ${code}`);
      setTimeout(() => { if (globalState.pairingCode === code) globalState.pairingCode = null; }, 90000);
      return code;
    } catch (err) {
      if (err.status === 409) throw err;
      console.error('[PAIR FAIL]', err?.message || err);
      throw new Error(err.message || 'Failed. Shell: rm -rf data/auth');
    }
  };

  bot.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 500, margin: 1 });
        globalState.qr = dataUrl;
        globalState.qrRaw = qr;
        if (globalState.status!== 'pairing') globalState.status = 'qr';
        await QRCode.toFile(path.join(__dirname, 'data', 'qrcode.png'), qr);
      } catch {}
      console.log(`[BALDWIN] QR ready - Session 2 Terminal`);
    }
    if (connection === 'open') {
      globalState.status = 'connected';
      globalState.connected = true;
      globalState.qr = null;
      globalState.pairingCode = null;
      const jid = bot.user?.id || '';
      globalState.number = jid.split(':')[0];
      console.log(`\n[CONNECTED] ${globalState.number}\n`);
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      try { if (config.OWNER_JID) await bot.sendMessage(config.OWNER_JID, { text: `*${config.BOT_NAME} CONNECTED* ✅\n${globalState.number}` }); } catch {}
      return;
    }
    if (connection === 'close') {
      globalState.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      const msg = lastDisconnect?.error?.message || '';
      console.log('[DISCONNECT]', code, msg);
      if (code === DisconnectReason.loggedOut || code === 401) {
        globalState.status = 'logged-out';
        setTimeout(() => { try { fs.rmSync(authDir, { recursive: true, force: true }); } catch {} globalState.status = 'qr'; }, 2000);
        return;
      }
      globalState.status = 'reconnecting';
      if (!reconnectTimer) {
        const delay = code === DisconnectReason.restartRequired? 2000 : 4000;
        reconnectTimer = setTimeout(() => { reconnectTimer = null; startBot().catch(console.error); }, delay);
      }
    }
  });

  // ===== 1000 FEATURES LOGIC =====
  bot.ev.on('group-participants.update', async (update) => {
    const features = getFeatures();
    try {
      if (update.action === 'add' && features.welcome) {
        for (let p of update.participants) {
          await bot.sendMessage(update.id, { text: `Welcome @${p.split('@')[0]} 🌸\nBaldwin Bot • Simon Tech`, mentions: [p] });
        }
      }
      if (update.action === 'remove' && features.goodbye) {
        for (let p of update.participants) {
          await bot.sendMessage(update.id, { text: `Goodbye @${p.split('@')[0]} 👋`, mentions: [p] });
        }
      }
    } catch {}
  });

  bot.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type!== 'notify') return;
    for (const msg of messages) {
      if (!msg?.message || msg.key?.fromMe) continue;
      const features = getFeatures();
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || '';
      const remoteJid = msg.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');

      // ANTILINK - from dashboard toggle
      if (isGroup && features.antilink) {
        if (/(https?:\/\/|www\.|chat\.whatsapp\.com)/i.test(text)) {
          try {
            const isAdmin = (await bot.groupMetadata(remoteJid)).participants.find(p => p.id === msg.key.participant)?.admin;
            if (!isAdmin) {
              await bot.sendMessage(remoteJid, { delete: msg.key });
              await bot.sendMessage(remoteJid, { text: `🚫 Link detected! @${msg.key.participant.split('@')[0]}`, mentions: [msg.key.participant] });
            }
          } catch {}
          continue;
        }
      }

      if (!text) continue;
      const prefix = config.PREFIX || '.';
      if (!text.trim().startsWith(prefix)) continue;

      const parts = text.trim().slice(prefix.length).trim().split(/\s+/);
      const cmdName = parts.shift()?.toLowerCase();
      if (!cmdName) continue;

      let command = globalState.commands.get(cmdName);
      if (!command) command = [...globalState.commands.values()].find(c => Array.isArray(c.aliases) && c.aliases.includes(cmdName));
      if (!command) continue;

      try {
        const ownerNumber = String(config.OWNER_NUMBER || '').replace(/\D/g, '');
        const sender = msg.key.participant || remoteJid;
        const isOwner = remoteJid === config.OWNER_JID || sender.includes(ownerNumber) || remoteJid.includes(ownerNumber);
        if (config.PUBLIC_MODE === false &&!isOwner) continue;

        await bot.sendPresenceUpdate('composing', remoteJid).catch(() => {});
        await command.run({ bot, sock: bot, msg, m: msg, args: parts, text: parts.join(' '), fullText: text, config, state: globalState, prefix, isOwner, sender });
      } catch (err) {
        console.error(`[CMD ${cmdName}]`, err);
        try { await bot.sendMessage(remoteJid, { text: '❌ Error: ' + err.message }); } catch {}
      }
    }
  });

  global.__bot = bot;
  global.__botState = globalState;
  return bot;
}

// ===== EXPORTS FOR index.js DASHBOARD =====
module.exports = {
  startBot,
  getQR: () => globalState.qr,
  getPairCode: () => globalState.pairingCode,
  get connectionStatus() { return globalState.status; },
  get commandsCount() { return globalState.commands?.size || 0; },
  generatePairingCode: async (phone) => {
    if (!globalState.requestPairingCode) throw new Error('Bot not ready');
    return await globalState.requestPairingCode(phone);
  },
  switchToQR: () => { globalState.mode = 'qr'; globalState.status = 'qr'; },
  switchToPairing: () => { globalState.mode = 'pairing'; globalState.status = 'pairing'; },
  getState: () => globalState
};
