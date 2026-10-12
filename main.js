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

const loadCommands = require('./lib/commandLoader');

let reconnectTimer = null;

// Prevent crash
process.on('uncaughtException', (e) => console.log('[ANTICRASH] Uncaught:', e.message));
process.on('unhandledRejection', (e) => console.log('[ANTICRASH] Rejection:', e?.message || e));

async function startBot({ state, config }) {
  const authDir = path.resolve(__dirname, 'data', 'auth');
  fs.mkdirSync(authDir, { recursive: true });
  fs.mkdirSync(path.resolve(__dirname, 'data'), { recursive: true });

  state.status = 'connecting';
  state.mode = state.mode || 'pairing';

  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const logger = pino({ level: 'silent' });

  const bot = makeWASocket({
    version,
    logger,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger)
    },
    browser: Browsers.ubuntu(config.BOT_NAME || 'BALDWIN-BOT'),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async () => undefined
  });

  state.bot = bot;

  // Commands
  try {
    state.commands = loadCommands(path.join(__dirname, 'commands'));
    console.log(`[BALDWIN] Loaded ${state.commands.size} commands`);
  } catch (e) {
    console.error('[BALDWIN] Command load fail:', e);
    state.commands = new Map();
  }

  bot.ev.on('creds.update', saveCreds);

  // ===== FIXED PAIRING CODE FUNCTION =====
  state.requestPairingCode = async (phoneNumber) => {
    try {
      let num = String(phoneNumber).replace(/\D/g, '');
      if (!num) throw new Error('Invalid number');
      if (num.length < 10) throw new Error('Number too short, use country code. Ex: 234...');

      // Baileys: if already registered, don't allow new pairing
      if (authState.creds.registered) {
        throw new Error('Already registered. Delete data/auth to pair new number');
      }

      console.log(`[PAIR] Requesting code for ${num}...`);
      
      // Small delay fixes "failed to generate" on Render
      await new Promise(r=>setTimeout(r,1000));
      
      const code = await bot.requestPairingCode(num);
      
      state.pairingCode = code;
      state.status = 'pairing';
      state.lastPairNumber = num;
      
      console.log(`[PAIR] ✅ Code for ${num}: ${code}`);
      
      // Auto clear after 90s
      setTimeout(() => { 
        if(state.pairingCode===code) {
          state.pairingCode=null;
          console.log('[PAIR] Code expired');
        }
      }, 90000);
      
      return code;
    } catch (err) {
      console.error('[PAIR FAIL]', err?.message || err);
      // Give user clear reason
      if(err.message?.includes('already')){
        throw err;
      }
      if(err.message?.includes('too many')){
        throw new Error('Too many attempts. Wait 5 mins then try again');
      }
      throw new Error(err.message || 'Failed to generate. Make sure number is valid WhatsApp number and you deleted old session');
    }
  };

  // QR Handler
  bot.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const dataUrl = await QRCode.toDataURL(qr, { width: 500, margin: 1 });
        state.qr = dataUrl;
        state.qrRaw = qr;
        if(state.status!=='pairing') state.status = 'qr';
        await QRCode.toFile(path.join(__dirname, 'data', 'qrcode.png'), qr);
      } catch {}
      
      console.log(`[BALDWIN] QR ready - Dashboard: http://localhost:${config.PORT||3000}`);
    }

    if (connection === 'open') {
      state.status = 'online';
      state.connected = true;
      state.qr = null;
      state.qrRaw = null;
      state.pairingCode = null;
      
      const jid = bot.user?.id || '';
      state.number = jid.split(':')[0];
      state.jid = jid;

      console.log(`\n[CONNECTED] ${state.number} Owner: ${config.OWNER_NAME}\n`);

      try {
        await bot.updateProfileStatus(`BALDWIN BOT • ${config.OWNER_NAME} • ${config.ORIGINAL_NUMBER} • Online ⚡`);
      } catch {}

      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      
      try {
        if(config.OWNER_JID) await bot.sendMessage(config.OWNER_JID, { text: `*${config.BOT_NAME} CONNECTED* ✅\nNumber: ${state.number}\n${new Date().toLocaleString()}` });
      } catch {}
      return;
    }

    if (connection === 'close') {
      state.connected = false;
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log('[DISCONNECT]', code, lastDisconnect?.error?.message);

      if (code === DisconnectReason.loggedOut) {
        state.status = 'logged-out';
        console.log('[BALDWIN] Logged out. Delete data/auth folder on Render Shell: rm -rf data/auth/*');
        return;
      }

      state.status = 'reconnecting';
      if (!reconnectTimer) {
        const delay = code === DisconnectReason.restartRequired ? 2000 : 4000;
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          startBot({ state, config }).catch(console.error);
        }, delay);
      }
    }
  });

  // MESSAGE HANDLER
  bot.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type !== 'notify') return;
    for(const msg of messages){
      if (!msg?.message || msg.key?.fromMe) continue;

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || msg.message.buttonsResponseMessage?.selectedButtonId || msg.message.listResponseMessage?.singleSelectReply?.selectedRowId || '';
      if (!text) continue;

      const prefix = config.PREFIX || '.';
      if (!text.trim().startsWith(prefix)) continue;

      const parts = text.trim().slice(prefix.length).trim().split(/\s+/);
      const cmdName = parts.shift()?.toLowerCase();
      if (!cmdName) continue;

      let command = state.commands.get(cmdName);
      if (!command) {
        command = [...state.commands.values()].find(c => Array.isArray(c.aliases) && c.aliases.includes(cmdName));
      }
      if (!command) continue;

      try {
        const remoteJid = msg.key.remoteJid;
        const ownerNumber = String(config.OWNER_NUMBER || config.ORIGINAL_NUMBER || '').replace(/\D/g,'');
        const sender = msg.key.participant || remoteJid;
        const isOwner = remoteJid === config.OWNER_JID || sender.includes(ownerNumber) || remoteJid.includes(ownerNumber);

        await bot.sendPresenceUpdate('composing', remoteJid).catch(()=>{});

        await command.run({
          bot,
          sock: bot,
          msg,
          m: msg,
          args: parts,
          text: parts.join(' '),
          fullText: text,
          config,
          state,
          prefix,
          isOwner,
          sender
        });

      } catch (err) {
        console.error(`[CMD ${cmdName}]`, err);
        try { await bot.sendMessage(msg.key.remoteJid, { text: '❌ Error: '+ err.message }); } catch {}
      }
    }
  });

  global.__bot = bot;
  global.__botState = state;
  return bot;
}

module.exports = { startBot };
