const config = require('../config');

module.exports = {
  name: 'alive',
  aliases: ['status'],
  description: 'Check whether the bot is online',
  async run({ bot, msg }) {
    await bot.sendMessage(msg.key.remoteJid, {
      text: `*${config.BOT_NAME} is online.*\nStatus: running\nOwner: ${config.OWNER_NAME}`
    });
  }
};
