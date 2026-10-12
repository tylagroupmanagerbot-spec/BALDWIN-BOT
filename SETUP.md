# BALDWIN-BOT Setup Instructions

## Local Development

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tylagroupmanagerbot-spec/BALDWIN-BOT.git
cd BALDWIN-BOT
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your values:
```
PORT=3000
BOT_NAME=Baldwin Bot
PREFIX=!
OWNER_NAME=Simon Tech Inc
OWNER_NUMBER=2349166265317
OWNER_JID=2349166265317@s.whatsapp.net
```

5. Add bot profile image:
   - Save your image as `assets/bot_pfp.jpg`

6. Start the bot:
```bash
npm start
```

7. Open your browser:
   - Dashboard: http://localhost:3000
   - Scan QR code or use pairing code

## Project Structure

```
BALDWIN-BOT/
├── index.js                 # Express server & API endpoints
├── main.js                  # Bot initialization & WhatsApp logic
├── config.js                # Configuration management
├── package.json             # Dependencies
├── .env.example             # Environment template
├── .gitignore               # Git ignore file
├── README.md                # Project overview
├── DEPLOYMENT.md            # Render deployment guide
├── SETUP.md                 # This file
│
├── public/
│   └── index.html           # Dashboard UI
│
├── lib/
│   ├── index.js             # Utility functions
│   └── commandLoader.js     # Command file loader
│
├── commands/                # Bot commands (150+)
│   ├── help.js
│   ├── ping.js
│   ├── owner.js
│   └── ...
│
├── data/                    # Generated at runtime
│   ├── auth/                # WhatsApp session data
│   └── qrcode.png          # Generated QR code
│
└── assets/
    └── bot_pfp.jpg         # Bot profile image
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| BOT_NAME | Baldwin Bot | Bot display name |
| PREFIX | ! | Command prefix |
| OWNER_NAME | Simon Tech Inc | Owner display name |
| OWNER_NUMBER | 2349166265317 | Owner WhatsApp number (no +) |
| OWNER_JID | 2349166265317@s.whatsapp.net | Owner JID |
| BOT_PFP_URL | - | Remote profile image URL |
| RENDER | false | Set to true on Render |

## Command Development

### Creating a New Command

Create `commands/mycommand.js`:

```javascript
const command = {
  meta: {
    name: 'mycommand',
    aliases: ['mc', 'my'],
    description: 'My custom command'
  },
  async run({ bot, msg, args, config, isOwner }) {
    const text = `Hello! Command args: ${args.join(', ')}`;
    await bot.sendMessage(msg.key.remoteJid, { text });
  }
};

module.exports = command;
```

The command will auto-load on bot startup.

## API Endpoints

### GET /
Bot status and info

### GET /health
Health check endpoint

### GET /status
Detailed status information

### GET /qr
QR code data (text)

### GET /qr/png
QR code as image file

### GET /pairing
ParIng code for WhatsApp login

### GET /commands
List all loaded commands

### POST /reconnect
Attempt to reconnect bot

## Debugging

### View Logs
```bash
# Local
npm start

# Render
Render Dashboard → Your Service → Logs
```

### Clear Session
Delete the `data/auth` folder to force re-login:
```bash
rm -rf data/auth
```

### Test Connection
```bash
curl http://localhost:3000/health
```

## Performance Tips

1. **Lazy load commands** - Only load commands that are used
2. **Cache frequently used data** - Store group metadata
3. **Rate limit commands** - Prevent spam
4. **Use message queuing** - Queue bulk messages
5. **Monitor memory** - Render free tier has limited RAM

## Security Best Practices

1. ✅ Keep `.env` file private
2. ✅ Never commit session data
3. ✅ Use `.gitignore` properly
4. ✅ Validate user input in commands
5. ✅ Check `isOwner` before sensitive operations
6. ✅ Don't log sensitive data
7. ✅ Rotate pairing codes regularly

## Common Issues

### Issue: "Module not found"
**Solution**: Run `npm install`

### Issue: "Port 3000 already in use"
**Solution**: Change PORT in `.env` or kill the process:
```bash
lsof -i :3000
kill -9 <PID>
```

### Issue: "QR not generating"
**Solution**: 
- Wait 30 seconds
- Check browser console for errors
- Restart bot: `npm start`

### Issue: "Bot connects but doesn't respond"
**Solution**:
- Check if command files exist in `/commands`
- Verify prefix in `.env`
- Check logs for command loading errors

## Support

- 📖 Read DEPLOYMENT.md for Render guide
- 📝 Check logs for errors
- 🔗 Visit GitHub issues

---

**Ready to deploy?** Follow DEPLOYMENT.md
