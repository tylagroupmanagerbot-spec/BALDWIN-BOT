module.exports = {
  name: 'mute',
  aliases: ['groupmute'],
  description: 'Mute group',
  async run({ bot, msg }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }
    await bot.groupSettingUpdate(msg.key.remoteJid, 'announcement');
    await bot.sendMessage(msg.key.remoteJid, { text: 'Group muted successfully.' });
  }
};
