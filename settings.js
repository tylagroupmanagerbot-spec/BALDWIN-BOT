const ownerNumber = String(
  process.env.OWNER_NUMBER || '2349166265317'
).replace(/\D/g, '');

module.exports = {
  botName: process.env.BOT_NAME || 'Baldwin Bot',
  prefix: process.env.PREFIX || '!',
  ownerName: process.env.OWNER_NAME || 'Simon Tech Inc',
  ownerNumber,
  ownerJid: `${ownerNumber}@s.whatsapp.net`,

  defaultStatus: process.env.DEFAULT_STATUS || 'online',

  qaMode:
    String(process.env.QA_MODE || 'false').toLowerCase() === 'true',

  adminOnly:
    String(process.env.ADMIN_ONLY || 'false').toLowerCase() === 'true',

  autoRead:
    String(process.env.AUTO_READ || 'true').toLowerCase() === 'true'
};
