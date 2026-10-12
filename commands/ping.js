const config = require('../config');

module.exports = {
  name: 'help',
  aliases: ['menu', 'h'],
  description: 'Show bot help menu',
  async run({ bot, msg, prefix }) {
    const text = [
      `*${config.BOT_NAME}*`,
      `Prefix: ${prefix}`,
      '',
      'Available commands:',
      '• !help • !ping • !alive • !owner • !botinfo',
      '• !groupinfo • !tagall • !kick • !ban • !unban',
      '• !promote • !demote • !mute • !unmute',
      '• !anime • !restart',
      '',
      'This bot supports QR login and pairing code login on Render.'
    ].join('\n');

    await bot.sendMessage(msg.key.remoteJid, { text });
  }
};
