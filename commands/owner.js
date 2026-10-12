const config = require('../config');

module.exports = {
  name: 'botinfo',
  aliases: ['info'],
  description: 'Show bot information',
  async run({ bot, msg }) {
    const text = [
      `*Bot Name:* ${config.BOT_NAME}`,
      `*Owner:* ${config.OWNER_NAME}`,
      `*Owner Number:* ${config.OWNER_NUMBER}`,
      `*Prefix:* ${config.PREFIX}`,
      `*Mode:* Render + WhatsApp pairing/QR login`,
      `*Version:* 1.0.0`
    ].join('\n');

    await bot.sendMessage(msg.key.remoteJid, { text });
  }
};
