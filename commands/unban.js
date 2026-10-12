module.exports = {
  name: 'ban',
  aliases: ['block'],
  description: 'Block a user number',
  async run({ bot, msg, args }) {
    const target = args[0] || msg.message.extendedTextMessage?.contextInfo?.participant;
    if (!target) return bot.sendMessage(msg.key.remoteJid, { text: 'Provide a number or mention a user to ban.' });
    await bot.updateBlockStatus(target, 'block');
    await bot.sendMessage(msg.key.remoteJid, { text: `Blocked: ${target}` });
  }
};
