const fs = require('fs');
const path = require('path');

/**
 * Load all command files from the commands directory.
 *
 * Each command should export:
 * {
 *   name: 'command',
 *   aliases: ['alias1', 'alias2'],
 *   async run({ bot, msg, args, ... }) {}
 * }
 */
function loadCommands(commandsPath) {
  const commands = new Map();

  const directory =
    commandsPath || path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(directory)) {
    console.error(`Commands directory not found: ${directory}`);
    return commands;
  }

  const files = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.js'))
    .sort();

  console.log(`Found ${files.length} command files.`);

  for (const file of files) {
    const filePath = path.join(directory, file);

    try {
      // Remove old cached version when restarting/reloading
      try {
        delete require.cache[require.resolve(filePath)];
      } catch (_) {}

      const command = require(filePath);

      if (!command || typeof command !== 'object') {
        console.warn(
          `Skipping ${file}: command must export an object.`
        );
        continue;
      }

      if (!command.name) {
        console.warn(
          `Skipping ${file}: missing command.name.`
        );
        continue;
      }

      if (typeof command.run !== 'function') {
        console.warn(
          `Skipping ${file}: missing command.run function.`
        );
        continue;
      }

      const commandName = String(command.name)
        .trim()
        .toLowerCase();

      if (!commandName) {
        console.warn(
          `Skipping ${file}: invalid command name.`
        );
        continue;
      }

      if (commands.has(commandName)) {
        console.warn(
          `Duplicate command "${commandName}" found in ${file}. ` +
          `Replacing the previously loaded command.`
        );
      }

      command.name = commandName;

      // Normalize aliases
      if (!Array.isArray(command.aliases)) {
        command.aliases = [];
      }

      command.aliases = command.aliases
        .map((alias) =>
          String(alias).trim().toLowerCase()
        )
        .filter(Boolean);

      // Store filename for debugging
      command.file = file;

      commands.set(commandName, command);

      console.log(
        `Loaded command: ${commandName} (${file})`
      );
    } catch (error) {
      console.error(
        `Failed to load command ${file}:`
      );

      console.error(
        error?.stack || error?.message || error
      );

      // Continue loading other commands instead of
      // crashing the entire bot.
      continue;
    }
  }

  console.log(
    `Successfully loaded ${commands.size} commands.`
  );

  return commands;
}

module.exports = loadCommands;
