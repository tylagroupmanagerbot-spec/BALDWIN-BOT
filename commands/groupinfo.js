const config = require('../config');

module.exports = {
  name: 'owner',
  aliases: ['sudo', 'creator'],
  description: 'Show owner details',
  async run({ bot, msg }) {
    await bot.sendMessage(msg.key.remoteJid, {
      text: `*Owner Name:* ${config.OWNER_NAME}\n*Owner Number:* ${config.OWNER_NUMBER}`
    });
  }
};
