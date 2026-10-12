# BALDWIN-BOT Deployment Guide

## Prerequisites
- Render account (https://render.com)
- GitHub account with this repository
- WhatsApp account with a phone number

## Quick Start on Render

### Step 1: Fork/Clone Repository
```bash
git clone https://github.com/tylagroupmanagerbot-spec/BALDWIN-BOT.git
cd BALDWIN-BOT
```

### Step 2: Deploy to Render

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select this repository
5. Configure:
   - **Name**: baldwin-bot
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or higher for better performance)

### Step 3: Set Environment Variables

In Render Dashboard → Your Service → Environment:

```
PORT=3000
NODE_ENV=production
BOT_NAME=Baldwin Bot
PREFIX=!
OWNER_NAME=Simon Tech Inc
OWNER_NUMBER=2349166265317
OWNER_JID=2349166265317@s.whatsapp.net
RENDER=true
```

### Step 4: Add Bot Profile Image

1. Upload your anime/custom bot profile image to `assets/bot_pfp.jpg`
2. Push to GitHub:
   ```bash
   git add assets/bot_pfp.jpg
   git commit -m "Add bot profile image"
   git push
   ```

### Step 5: Deploy

1. In Render, click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Once "Live" status appears, open your service URL

## WhatsApp Login

### QR Code Method
1. Open your bot's Render URL
2. Find the QR code on the dashboard
3. Open WhatsApp on your phone
4. Go to **Settings** → **Linked Devices** → **Link a Device**
5. Scan the QR code
6. Confirm on your phone

### Pairing Code Method (If QR doesn't work)
1. Check the Render logs for the pairing code
2. In WhatsApp: **Settings** → **Linked Devices** → **Link with Pairing Code**
3. Enter the 8-digit code from the logs
4. Confirm

## API Endpoints

Once deployed and connected:

- **Dashboard**: `https://your-bot-url.onrender.com`
- **Status**: `https://your-bot-url.onrender.com/status`
- **Health**: `https://your-bot-url.onrender.com/health`
- **QR Code**: `https://your-bot-url.onrender.com/qr`
- **Pairing Code**: `https://your-bot-url.onrender.com/pairing`
- **Commands**: `https://your-bot-url.onrender.com/commands`

## Bot Commands

Once connected, use the bot with prefix `!`:

```
!help      - Show all commands
!ping      - Test bot response
!owner     - Show owner info
!botinfo   - Bot details
!alive     - Check if bot is online
```

## Troubleshooting

### Bot won't connect
1. Check Render logs for errors
2. Verify all environment variables are set
3. Try redeploying
4. Clear old sessions: delete `/data/auth` folder

### QR code not showing
1. Check browser console for errors
2. Wait 30 seconds for QR to generate
3. Refresh the page
4. Use pairing code method instead

### Session expires
1. WhatsApp sessions expire after 90 days of inactivity
2. Scan QR code again or use pairing code
3. Make sure Render service stays "Live"

## Important Notes

⚠️ **Security**:
- Never share your pairing code or session files
- Keep `.env` file private
- Don't expose `/data/auth` folder
- Use environment variables for sensitive data

⚠️ **Render Limitations**:
- Free tier may sleep after 15 mins of inactivity
- Data is not persistent (use paid plans for persistence)
- Monthly usage limits apply

⚠️ **WhatsApp Policy**:
- Use this bot responsibly
- Follow WhatsApp's Terms of Service
- Don't spam or abuse the service
- May violate WhatsApp ToS if used commercially

## Support

For issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check browser console for frontend errors
3. Review error messages in deployment logs
4. Check GitHub issues

## Next Steps

1. ✅ Deploy to Render
2. ✅ Scan QR/Pairing Code
3. ✅ Test with !ping command
4. ✅ Add more custom commands in `/commands`
5. ✅ Monitor bot status on dashboard

---

**Owner**: Simon Tech Inc
**Number**: +2349166265317
**Version**: 1.0.0
