const config = require('../config');

function ownerReply(bot, msg) {
  return bot.sendMessage(msg.key.remoteJid, {
    text: `Owner: ${config.OWNER_NAME}\nNumber: ${config.OWNER_NUMBER}`
  });
}

module.exports = { ownerReply };
