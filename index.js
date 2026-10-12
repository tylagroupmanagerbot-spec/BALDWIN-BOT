const express = require('express');
const { startBot } = require('./main');
const config = require('./config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const state = {
  qr: null,
  pairingCode: null,
  status: 'starting',
  bot: null,
  uptime: Date.now()
};

// Home/status route
app.get('/', (req, res) => {
  res.json({
    name: config.BOT_NAME || 'BALDWIN-BOT',
    status: state.status,
    qr: state.qr ? 'available' : 'not ready',
    pairingCode: state.pairingCode || null,
    owner: config.OWNER_NAME || 'Owner',
    ownerNumber: config.OWNER_NUMBER || null,
    uptime: Date.now() - state.uptime
  });
});

// Render health check
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    status: state.status,
    uptime: Date.now() - state.uptime
  });
});

// QR endpoint
app.get('/qr', (req, res) => {
  if (!state.qr) {
    return res.status(404).json({
      ok: false,
      message: 'QR not generated yet.'
    });
  }

  return res.type('text/plain').send(state.qr);
});

// Pairing code endpoint
app.get('/pairing', (req, res) => {
  if (!state.pairingCode) {
    return res.status(404).json({
      ok: false,
      message: 'Pairing code not generated yet.'
    });
  }

  return res.json({
    ok: true,
    pairingCode: state.pairingCode
  });
});

// Use Render's PORT when available
const PORT = process.env.PORT || config.PORT || 3000;

// Start HTTP server first
app.listen(PORT, '0.0.0.0', () => {
  console.log(`BALDWIN-BOT HTTP server running on port ${PORT}`);
});

// Start WhatsApp bot
async function bootBot() {
  try {
    console.log('Starting BALDWIN-BOT...');

    await startBot({
      state,
      config
    });
  } catch (error) {
    state.status = 'error';

    console.error('Failed to start BALDWIN-BOT:');
    console.error(error);

    // Retry instead of immediately killing the Render service
    setTimeout(() => {
      console.log('Retrying bot startup...');
      bootBot();
    }, 10000);
  }
}

bootBot();

// Catch unexpected promise errors
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// Catch unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
