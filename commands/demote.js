module.exports = {
  name: 'promote',
  aliases: ['admin'],
  description: 'Promote user to admin',
  async run({ bot, msg, args }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }
    const target = msg.message.extendedTextMessage?.contextInfo?.participant || args[0];
    if (!target) return bot.sendMessage(msg.key.remoteJid, { text: 'Mention a user or provide a JID to promote.' });
    await bot.groupParticipantsUpdate(msg.key.remoteJid, [target], 'promote');
    await bot.sendMessage(msg.key.remoteJid, { text: 'User promoted to admin.' });
  }
};
