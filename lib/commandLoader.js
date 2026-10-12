const fs = require('fs');
const path = require('path');

/**
 * Load all command files from a directory
 * @param {string} commandsDir - Path to commands directory
 * @returns {Map} Map of command names to command objects
 */
function loadCommands(commandsDir) {
  const commandMap = new Map();

  if (!fs.existsSync(commandsDir)) {
    console.warn(`[WARN] Commands directory not found: ${commandsDir}`);
    return commandMap;
  }

  const files = fs.readdirSync(commandsDir)
    .filter((file) => file.endsWith('.js'))
    .sort();

  for (const file of files) {
    try {
      const fullPath = path.join(commandsDir, file);
      delete require.cache[require.resolve(fullPath)];
      const required = require(fullPath);

      if (!required || typeof required.run !== 'function') {
        console.warn(`[WARN] Invalid command file: ${file} (missing run function)`);
        continue;
      }

      const meta = required.meta || { name: path.basename(file, '.js'), aliases: [] };
      const names = [meta.name, ...(meta.aliases || [])].filter(Boolean);

      for (const name of names) {
        const normalized = String(name).trim().toLowerCase();
        if (normalized) {
          commandMap.set(normalized, required);
        }
      }

      console.log(`[LOG] Loaded command: ${meta.name} (aliases: ${meta.aliases?.join(', ') || 'none'})`);
    } catch (error) {
      console.error(`[ERROR] Failed to load command ${file}:`, error.message);
    }
  }

  console.log(`[LOG] Total commands loaded: ${commandMap.size}`);
  return commandMap;
}

module.exports = loadCommands;
