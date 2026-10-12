module.exports = {
  name: 'ping',
  aliases: ['pong'],
  description: 'Check bot latency',
  async run({ bot, msg }) {
    const start = Date.now();
    await bot.sendMessage(msg.key.remoteJid, { text: 'Pinging...' });
    const elapsed = Date.now() - start;
    await bot.sendMessage(msg.key.remoteJid, { text: `Pong! Response time: ${elapsed}ms` });
  }
};
