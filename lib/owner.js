const config = require('../config');

function isGroupJid(jid) {
  return !!jid && jid.endsWith('@g.us');
}

function getSenderId(msg) {
  return msg?.key?.remoteJid || msg?.sender || ''; 
}

function isOwner(msg) {
  const sender = getSenderId(msg);
  return sender.includes(config.OWNER_NUMBER) || sender === config.OWNER_JID;
}

function randomItem(list) {
  if (!Array.isArray(list) || !list.length) return '';
  return list[Math.floor(Math.random() * list.length)];
}

function getCommandText(text, prefix) {
  if (!text) return '';
  const clean = text.trim();
  return clean.startsWith(prefix) ? clean.slice(prefix.length).trim() : clean;
}

module.exports = {
  isGroupJid,
  getSenderId,
  isOwner,
  randomItem,
  getCommandText
};
