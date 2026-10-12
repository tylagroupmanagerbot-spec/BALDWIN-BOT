/**
 * Baileys Bot Utilities Library
 * Provides helper functions and utilities for bot operations
 */

const loadCommands = require('./commandLoader');

/**
 * Check if a user is the bot owner
 * @param {string} jid - User JID to check
 * @param {string} ownerJid - Owner JID from config
 * @returns {boolean}
 */
function isOwner(jid, ownerJid) {
  return jid === ownerJid || jid?.includes(ownerJid?.split('@')[0]);
}

/**
 * Check if a user is a group admin
 * @param {object} sock - Socket connection
 * @param {string} groupJid - Group JID
 * @param {string} userJid - User JID
 * @returns {Promise<boolean>}
 */
async function isAdmin(sock, groupJid, userJid) {
  try {
    const groupMetadata = await sock.groupMetadata(groupJid);
    const admins = groupMetadata.participants
      .filter(p => p.admin)
      .map(p => p.id);
    return admins.includes(userJid);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Format a response message with styling
 * @param {string} message - The message to format
 * @param {string} type - Message type: 'info', 'error', 'success', 'warning'
 * @returns {string}
 */
function formatMessage(message, type = 'info') {
  const symbols = {
    info: 'ℹ️',
    error: '❌',
    success: '✅',
    warning: '⚠️'
  };

  return `${symbols[type] || '•'} ${message}`;
}

/**
 * Send a text message
 * @param {object} sock - Socket connection
 * @param {string} jid - Recipient JID
 * @param {string} text - Message text
 * @returns {Promise}
 */
async function sendText(sock, jid, text) {
  return sock.sendMessage(jid, { text });
}

/**
 * Send a reply to a message
 * @param {object} sock - Socket connection
 * @param {object} msg - Message object
 * @param {string} text - Reply text
 * @returns {Promise}
 */
async function reply(sock, msg, text) {
  return sock.sendMessage(msg.key.remoteJid, {
    text,
    quoted: msg
  });
}

/**
 * Parse command arguments safely
 * @param {string} text - Command text
 * @param {string} prefix - Command prefix
 * @returns {object}
 */
function parseCommand(text, prefix) {
  const trimmed = text.trim();
  if (!trimmed.startsWith(prefix)) {
    return { valid: false };
  }

  const args = trimmed.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  return {
    valid: true,
    command,
    args,
    fullText: trimmed
  };
}

/**
 * Get time-based greeting
 * @returns {string}
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format milliseconds to readable time string
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

module.exports = {
  loadCommands,
  isOwner,
  isAdmin,
  formatMessage,
  sendText,
  reply,
  parseCommand,
  getGreeting,
  formatTime
};
