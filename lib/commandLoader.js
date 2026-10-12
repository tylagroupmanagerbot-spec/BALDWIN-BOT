{
  "name": "baldwin-bot",
  "version": "1.0.0",
  "description": "WhatsApp bot for Render deployment",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node main.js"
  },
  "engines": {
    "node": ">=20"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^7.0.0",
    "axios": "^1.7.7",
    "dotenv": "^16.4.1",
    "express": "^4.19.2",
    "pino": "^9.4.0",
    "qrcode": "^1.5.4",
    "qrcode-terminal": "^0.12.0"
  }
}
