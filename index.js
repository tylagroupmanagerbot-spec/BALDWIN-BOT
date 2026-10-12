const express = require('express');
const path = require('path');
const { startBot } = require('./main');
const config = require('./config');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Bot state object
const state = {
  qr: null,
  pairingCode: null,
  status: 'starting',
  bot: null,
  commands: null,
  uptime: Date.now()
};

// API Routes

/**
 * GET / - Main dashboard and bot status
 */
app.get('/', (_, res) => {
  const uptimeMs = Date.now() - state.uptime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  res.json({
    status: 'ok',
    bot: {
      name: config.BOT_NAME,
      status: state.status,
      version: config.VERSION,
      owner: config.OWNER_NAME,
      ownerNumber: config.OWNER_NUMBER,
      prefix: config.PREFIX
    },
    session: {
      qr: state.qr ? 'available' : 'not_ready',
      pairingCode: state.pairingCode ? 'available' : 'not_ready',
      uptime: {
        ms: uptimeMs,
        formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      }
    },
    commands: {
      total: state.commands?.size || 0,
      loaded: state.commands ? true : false
    }
  });
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (_, res) => {
  const isHealthy = state.status === 'online';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    ok: isHealthy,
    status: state.status,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - state.uptime
  });
});

/**
 * GET /qr - Get QR code data
 */
app.get('/qr', (_, res) => {
  if (!state.qr) {
    return res.status(404).json({
      ok: false,
      status: 'qr_not_ready',
      message: 'QR code not generated yet. Bot is initializing.'
    });
  }

  res.type('text/plain').send(state.qr);
});

/**
 * GET /qr/png - Get QR code as image
 */
app.get('/qr/png', (_, res) => {
  const fs = require('fs');
  const qrPath = path.join(__dirname, 'data', 'qrcode.png');

  if (!fs.existsSync(qrPath)) {
    return res.status(404).json({ ok: false, message: 'QR image not found' });
  }

  res.type('image/png').sendFile(qrPath);
});

/**
 * GET /pairing - Get pairing code
 */
app.get('/pairing', (_, res) => {
  if (!state.pairingCode) {
    return res.status(404).json({
      ok: false,
      status: 'code_not_ready',
      message: 'Pairing code not generated yet. Bot is initializing.'
    });
  }

  res.json({
    ok: true,
    pairingCode: state.pairingCode,
    ownerNumber: config.OWNER_NUMBER,
    instructions: 'Go to WhatsApp Settings → Linked Devices → Link with Pairing Code'
  });
});

/**
 * GET /status - Detailed bot status
 */
app.get('/status', (_, res) => {
  res.json({
    bot: {
      name: config.BOT_NAME,
      status: state.status,
      owner: config.OWNER_NAME,
      ownerNumber: config.OWNER_NUMBER
    },
    connection: {
      connected: state.status === 'online',
      status: state.status,
      qrGenerated: !!state.qr,
      pairingCodeGenerated: !!state.pairingCode
    },
    uptime: Date.now() - state.uptime,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /commands - List all available commands
 */
app.get('/commands', (_, res) => {
  if (!state.commands) {
    return res.json({ commands: [], total: 0, loaded: false });
  }

  const commands = [];
  for (const [name, cmd] of state.commands) {
    if (cmd.meta) {
      commands.push({
        name: cmd.meta.name || name,
        aliases: cmd.meta.aliases || [],
        description: cmd.meta.description || 'No description'
      });
    }
  }

  res.json({
    commands: commands.filter((v, i, a) => a.findIndex(t => t.name === v.name) === i),
    total: state.commands.size,
    loaded: true
  });
});

/**
 * POST /reconnect - Attempt to reconnect bot
 */
app.post('/reconnect', (_, res) => {
  console.log('[API] Reconnect requested');
  
  if (state.bot && typeof state.bot.end === 'function') {
    state.bot.end();
  }

  state.status = 'reconnecting';
  state.qr = null;
  state.pairingCode = null;

  res.json({
    ok: true,
    message: 'Reconnect initiated',
    status: state.status
  });
});

/**
 * 404 handler
 */
app.use((_, res) => {
  res.status(404).json({
    ok: false,
    message: 'Endpoint not found',
    available_endpoints: ['/', '/health', '/qr', '/pairing', '/status', '/commands']
  });
});

/**
 * Start the server
 */
async function startServer() {
  try {
    console.log('[LOG] Starting bot...');
    await startBot({ state, config });

    const port = Number(process.env.PORT || config.PORT || 3000);
    app.listen(port, () => {
      console.log('[SUCCESS] Server running on port', port);
      console.log(`[LOG] Dashboard: http://localhost:${port}`);
      console.log(`[LOG] Health: http://localhost:${port}/health`);
      console.log(`[LOG] Status: http://localhost:${port}/status`);
    });
  } catch (error) {
    console.error('[FATAL] Server startup failed:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[LOG] Shutting down gracefully...');
  if (state.bot && typeof state.bot.end === 'function') {
    state.bot.end();
  }
  process.exit(0);
});

module.exports = app;
