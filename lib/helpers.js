const fs = require('fs');
const path = require('path');

module.exports = function loadCommands(commandsDir) {
  const commands = new Map();
  if (!fs.existsSync(commandsDir)) return commands;

  const files = fs.readdirSync(commandsDir).filter((file) => file.endsWith('.js')).sort();

  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    const command = require(filePath);
    if (!command || !command.name) continue;
    commands.set(command.name, command);
    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) commands.set(alias, command);
    }
  }

  return commands;
};
