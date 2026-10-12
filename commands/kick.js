module.exports = {
  name: 'restart',
  aliases: ['reboot'],
  description: 'Restart the bot',
  async run({ bot, msg }) {
    await bot.sendMessage(msg.key.remoteJid, { text: 'Restarting killer bot...' });
    process.exit(0);
  }
};
