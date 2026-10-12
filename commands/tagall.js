module.exports = {
  name: 'groupinfo',
  aliases: ['ginfo', 'group'],
  description: 'Show group information',
  async run({ bot, msg }) {
    const chatId = msg.key.remoteJid;
    const metadata = await bot.groupMetadata(chatId);
    const text = [
      `*Group:* ${metadata.subject}`,
      `*Participants:* ${metadata.participants.length}`,
      `*Creation:* ${new Date(metadata.creation * 1000).toLocaleString()}`
    ].join('\n');

    await bot.sendMessage(chatId, { text });
  }
};
