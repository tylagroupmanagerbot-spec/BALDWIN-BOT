module.exports = {
  name: 'unmute',
  aliases: ['groupunmute'],
  description: 'Unmute group',
  async run({ bot, msg }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }
    await bot.groupSettingUpdate(msg.key.remoteJid, 'not_announcement');
    await bot.sendMessage(msg.key.remoteJid, { text: 'Group unmuted successfully.' });
  }
};
