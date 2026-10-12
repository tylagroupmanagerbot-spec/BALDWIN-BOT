# BALDWIN-BOT

<p align="center">
  <img src="https://raw.githubusercontent.com/tylagroupmanagerbot-spec/BALDWIN-BOT/render-bot-setup/assets/bot_pfp.jpg" alt="BALDWIN-BOT Profile" width="220" height="220" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Baileys" />
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 20" />
  <img src="https://img.shields.io/badge/Render-Deploy-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render Deploy" />
  <img src="https://img.shields.io/badge/Status-Online-green?style=for-the-badge" alt="Status Online" />
</p>

A premium WhatsApp automation bot for Render hosting, built with Baileys, QR login, pairing code login, owner configuration, command system, and a custom dashboard.

## Premium Overview

BALDWIN-BOT is a production-ready WhatsApp bot designed for smooth deployment on Render. It supports:

- QR code login
- Pairing code login
- Session management dashboard
- Owner-controlled commands
- Group moderation utilities
- Bot health and status endpoints
- Clean deployment setup for web hosting

## Bot Profile Image

This bot is configured to use a premium profile image. Upload your preferred file as:

```bash
/assets/bot_pfp.jpg
```

If your image is hosted remotely, set this env var:

```bash
BOT_PFP_URL=https://your-image-url
```

## Features

- WhatsApp Web QR support
- Pairing-code based verification
- Responsive bot dashboard UI
- Render-ready startup configuration
- Health endpoint for monitoring
- Bot profile auto-update logic
- Command loader and modular structure
- Owner info and bot configuration support

## Installation

```bash
git clone https://github.com/tylagroupmanagerbot-spec/BALDWIN-BOT.git
cd BALDWIN-BOT
npm install
```

## Running the Bot

```bash
npm start
```

The bot will start and generate either:

- a QR code for login in the terminal
- or a pairing code for mobile device linking

## Render Deployment

Deploy this project to Render using these values:

- Start command: `npm start`
- Node version: `20`
- Environment variables:

```bash
PORT=3000
PREFIX=!
BOT_NAME=Baldwin Bot
OWNER_NAME=Simon Tech Inc
OWNER_NUMBER=2349166265317
OWNER_JID=2349166265317@s.whatsapp.net
BOT_PFP_URL=
```

## Dashboard Access

The bot includes a dashboard for pairing and session monitoring. Open your Render app URL and access the main page to view:

- QR code
- pairing code
- bot status
- uptime
- logs
- session controls

## Owner Information

- Name: Simon Tech Inc
- Number: +2349166265317

## Security Reminder

Keep pairing codes, authentication sessions, and credentials private. Never expose them in public repositories or public dashboards.

## License

This project is currently maintained for personal deployment and operational use.

## Support

For setup, login issues, or deployment help, use the Render logs and the dashboard endpoints to monitor and manage the session.
