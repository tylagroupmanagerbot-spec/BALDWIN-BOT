module.exports = {
  name: 'tagall',
  aliases: ['everyone'],
  description: 'Tag all members in group',
  async run({ bot, msg }) {
    if (!msg.key.remoteJid.endsWith('@g.us')) {
      return bot.sendMessage(msg.key.remoteJid, { text: 'This command only works in groups.' });
    }

    const metadata = await bot.groupMetadata(msg.key.remoteJid);
    const mentions = metadata.participants.map((p) => p.id);
    await bot.sendMessage(msg.key.remoteJid, {
      text: '@everyone\nBaldwin Bot is active in this group.',
      mentions
    });
  }
};
