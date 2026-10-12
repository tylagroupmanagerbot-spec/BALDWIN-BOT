const config = require('../config');

module.exports = {
  name: 'pairing',
  aliases: ['pair'],
  description: 'Show pairing usage information',
  async run({ bot, msg }) {
    await bot.sendMessage(msg.key.remoteJid, {
      text: `*Pairing setup for ${config.BOT_NAME}*\nUse the WhatsApp QR scan in the server logs or use pairing code from your Render terminal.\nOwner: ${config.OWNER_NAME}`
    });
  }
};
