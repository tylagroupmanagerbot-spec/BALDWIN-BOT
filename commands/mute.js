module.exports = {
  name: 'demote',
  aliases: ['deadmin'],
  description: 'Demote admin to member',
  async run({ bot, msg, args }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }
    const target = msg.message.extendedTextMessage?.contextInfo?.participant || args[0];
    if (!target) return bot.sendMessage(msg.key.remoteJid, { text: 'Mention a user or provide a JID to demote.' });
    await bot.groupParticipantsUpdate(msg.key.remoteJid, [target], 'demote');
    await bot.sendMessage(msg.key.remoteJid, { text: 'User demoted.' });
  }
};
