module.exports = {
  name: 'kick',
  aliases: ['remove'],
  description: 'Remove tagged participant from a group',
  async run({ bot, msg, args }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }
    const target = msg.message.extendedTextMessage?.contextInfo?.participant || args[0];
    if (!target) return bot.sendMessage(msg.key.remoteJid, { text: 'Mention a user or provide a JID to kick.' });
    await bot.groupParticipantsUpdate(msg.key.remoteJid, [target], 'remove');
    await bot.sendMessage(msg.key.remoteJid, { text: 'User removed from group.' });
  }
};
