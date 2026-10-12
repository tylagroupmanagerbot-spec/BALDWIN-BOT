require('dotenv').config();

const ORIGINAL_NUMBER = '2349166265317';
const ownerNumber = String(process.env.OWNER_NUMBER || ORIGINAL_NUMBER).replace(/\D/g,'');
const extraOwners = String(process.env.OWNER_NUMBERS || '').split(',').map(s=>s.replace(/\D/g,'')).filter(Boolean);
const allOwners = [...new Set([ownerNumber, ORIGINAL_NUMBER, ...extraOwners])];

module.exports = {
  // ====== BALDWIN BRANDING - LOCKED ======
  botName: process.env.BOT_NAME || 'BALDWIN-BOT',
  fullName: 'Baldwin iv x sultan Saladi',
  version: '2.0.0 Premium',
  ownerName: process.env.OWNER_NAME || 'Simon Tech Inc',
  ownerNumber: ownerNumber,
  originalNumber: ORIGINAL_NUMBER,
  originalDisplay: '09166265317',
  allOwnerNumbers: allOwners,
  ownerJid: `${ownerNumber}@s.whatsapp.net`,
  ownerJids: allOwners.map(n=>`${n}@s.whatsapp.net`),

  // ====== PREFIX & MODE ======
  prefix: process.env.PREFIX || '.',
  defaultStatus: process.env.DEFAULT_STATUS || 'Baldwin Bot • Simon Tech Inc • 09166265317',
  publicMode: String(process.env.PUBLIC_MODE || 'true').toLowerCase() === 'true',
  qaMode: String(process.env.QA_MODE || 'false').toLowerCase() === 'true',
  adminOnly: String(process.env.ADMIN_ONLY || 'false').toLowerCase() === 'true',
  autoRead: String(process.env.AUTO_READ || 'false').toLowerCase() === 'true',
  autoTyping: String(process.env.AUTO_TYPING || 'true').toLowerCase() === 'true',
  autoReact: String(process.env.AUTO_REACT || 'false').toLowerCase() === 'true',

  // ====== SECURITY ======
  antiCall: String(process.env.ANTI_CALL || 'false').toLowerCase() === 'true',
  antiDelete: String(process.env.ANTI_DELETE || 'false').toLowerCase() === 'true',
  antiLink: String(process.env.ANTI_LINK || 'false').toLowerCase() === 'true',

  // ====== UI ======
  theme: {
    primary: '#7c3aed',
    secondary: '#22d3ee',
    success: '#22c55e'
  },

  // ====== HELPERS ======
  isOwner: (jid) => {
    if(!jid) return false;
    const clean = String(jid).replace(/\D/g,'');
    return allOwners.some(o => clean.includes(o) || String(jid).includes(o));
  },

  mess: {
    owner: '*_Only owner can use this command_* • Simon Tech Inc',
    admin: '*_Admin only_*',
    group: '*_Group only_*',
    private: '*_Private chat only_*',
    wait: '*_Processing..._* ⚡',
    error: '*_Failed_* ❌',
    done: '*_Done_* ✅'
  }
};
