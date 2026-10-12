const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const loadCommands = require('./lib/commandLoader');

// Ensure required directories exist
function ensureFolders() {
  const directories = ['./data', './data/auth', './assets', './public'];
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[LOG] Created directory: ${dir}`);
    }
  }
}

// Get bot profile image from local or remote source
async function getBotImageBuffer() {
  const localCandidates = [
    './assets/bot_pfp.jpg',
    './assets/bot_pfp.jpeg',
    './assets/bot_pfp.png',
    './assets/bot_pfp.webp',
    './assets/profile.jpg',
    './assets/profile.png'
  ];

  for (const candidate of localCandidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      console.log(`[LOG] Found local profile image: ${candidate}`);
      return fs.readFileSync(resolved);
    }
  }

  const remoteUrl = process.env.BOT_PFP_URL || 'https://raw.githubusercontent.com/tylagroupmanagerbot-spec/BALDWIN-BOT/render-bot-setup/assets/bot_pfp.jpg';

  try {
    const res = await axios.get(remoteUrl, { responseType: 'arraybuffer' });
    console.log('[LOG] Downloaded profile image from remote URL');
    return Buffer.from(res.data);
  } catch (error) {
    console.warn('[WARN] Profile image not available:', error.message);
    return null;
  }
}

// Set bot profile picture and name
async function setBotProfile(sock, config) {
  try {
    if (!sock.user) {
      console.log('[WARN] Bot user not available yet');
      return;
    }

    const image = await getBotImageBuffer();
    if (!image) {
      console.warn('[WARN] No profile image found. Upload to ./assets/bot_pfp.jpg or set BOT_PFP_URL');
      return;
    }

    await sock.updateProfilePicture(sock.user.id, image);
    console.log('[SUCCESS] Profile picture updated');

    await sock.updateProfileName(config.BOT_NAME);
    console.log('[SUCCESS] Profile name updated to:', config.BOT_NAME);
  } catch (error) {
    console.warn('[ERROR] Profile update failed:', error.message);
  }
}

// Request pairing code
async function requestPairingCode(sock, config, state) {
  try {
    const code = await sock.requestPairingCode(config.OWNER_NUMBER);
    state.pairingCode = code;
    console.log('[SUCCESS] Pairing code:', code);
  } catch (error) {
    console.warn('[ERROR] Pairing code request failed:', error.message);
  }
}

// Main bot startup function
async function startBot({ state, config }) {
  console.log('[LOG] Initializing BALDWIN-BOT...');
  ensureFolders();

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(path.resolve('./data/auth'));
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: 'info' });

    const bot = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('BALDWIN-BOT'),
      auth: authState,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      shouldSyncHistoryMessage: () => false
    });

    state.bot = bot;

    bot.ev.on('creds.update', saveCreds);

    bot.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.status = 'qr';
        state.qr = qr;
        console.log('[LOG] QR Code generated. Scan with WhatsApp');

        try {
          const qrPng = await QRCode.toFile(path.join('./data', 'qrcode.png'), qr);
          console.log('[SUCCESS] QR saved to ./data/qrcode.png');
        } catch (err) {
          console.warn('[WARN] Could not save QR file:', err.message);
        }

        try {
          const qrTerminal = await QRCode.toString(qr, { type: 'terminal', small: true });
          console.log('[TERMINAL] QR Code:\n', qrTerminal);
        } catch (err) {
          console.warn('[WARN] Terminal QR not available');
        }

        // Request pairing code as alternative
        await requestPairingCode(bot, config, state);
        return;
      }

      if (connection === 'open') {
        state.status = 'online';
        state.qr = null;
        console.log('[SUCCESS] Bot connected to WhatsApp successfully!');

        await setBotProfile(bot, config);

        // Load commands
        try {
          const commandsDir = path.join(__dirname, 'commands');
          const commands = loadCommands(commandsDir);
          state.commands = commands;
          console.log(`[LOG] Loaded ${commands.size} commands`);
        } catch (error) {
          console.error('[ERROR] Command loader failed:', error);
        }

        return;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[LOG] Connection closed. Status: ${statusCode} | Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          console.log('[LOG] Attempting to reconnect in 3 seconds...');
          setTimeout(() => startBot({ state, config }), 3000);
        } else {
          console.log('[INFO] Bot logged out. Please scan QR again.');
        }
      }
    });

    // Handle incoming messages
    bot.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];

      if (!msg || (!msg.message && !msg.key)) return;
      if (msg.key?.fromMe) return;

      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      if (!text) return;

      const prefix = config.PREFIX;
      const trimmed = text.trim();

      if (!trimmed.startsWith(prefix)) return;

      const args = trimmed.slice(prefix.length).trim().split(/\s+/);
      const commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      const commands = state.commands || loadCommands(path.join(__dirname, 'commands'));
      state.commands = commands;

      const cmd = commands.get(commandName) || [...commands.values()].find((command) => (command.meta?.aliases || []).includes(commandName));

      if (!cmd) return;

      try {
        console.log(`[CMD] Executing: ${commandName} from ${msg.key.remoteJid}`);

        await cmd.run({
          bot,
          msg,
          args,
          text: trimmed,
          config,
          state,
          prefix,
          isOwner: msg.key.remoteJid === config.OWNER_JID || msg.key.remoteJid?.includes(config.OWNER_NUMBER)
        });
      } catch (error) {
        console.error('[ERROR] Command execution failed:', error);
        await bot.sendMessage(msg.key.remoteJid, { text: '❌ Error executing command. Check logs.' });
      }
    });

    global.__bot = bot;
    global.__botState = state;
    global.__config = config;

    console.log('[SUCCESS] Bot initialized and ready!');
    return bot;
  } catch (error) {
    console.error('[FATAL] Bot startup failed:', error);
    process.exit(1);
  }
}

module.exports = { startBot, ensureFolders, getBotImageBuffer, setBotProfile };
