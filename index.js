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

app.get('/', (_, res) => {
  res.json({
    name: config.BOT_NAME,
    status: state.status,
    qr: state.qr ? 'available' : 'not ready',
    pairingCode: state.pairingCode || null,
    owner: config.OWNER_NAME,
    ownerNumber: config.OWNER_NUMBER,
    uptime: Date.now() - state.uptime
  });
});

app.get('/health', (_, res) => {
  res.json({ ok: true, status: state.status, uptime: Date.now() - state.uptime });
});

app.get('/qr', (_, res) => {
  if (!state.qr) {
    return res.status(404).json({ ok: false, message: 'QR not generated yet.' });
  }
  res.type('text/plain').send(state.qr);
});

app.get('/pairing', (_, res) => {
  if (!state.pairingCode) {
    return res.status(404).json({ ok: false, message: 'Pairing code not generated yet.' });
  }
  res.json({ ok: true, pairingCode: state.pairingCode });
});

startBot({ state, config });

const port = config.PORT;
app.listen(port, () => {
  console.log(`HTTP server running on port ${port}`);
});
