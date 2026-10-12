const { randomItem } = require('../lib/helpers');

const lines = [
  'Anime energy activated!',
  'The code is strong, the heart is stronger.',
  'Never stop leveling up.',
  'Power comes from discipline.'
];

module.exports = {
  name: 'anime',
  aliases: ['waifu', 'otaku'],
  description: 'Send anime-style status lines',
  async run({ bot, msg }) {
    await bot.sendMessage(msg.key.remoteJid, { text: randomItem(lines) });
  }
};
