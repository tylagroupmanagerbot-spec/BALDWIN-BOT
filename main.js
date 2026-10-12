const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');

const loadCommands = require('./lib/commandLoader');

// Prevent multiple reconnect timers from being created
let reconnectTimer = null;

async function startBot({ state, config }) {
  try {
    // Make sure required folders exist
    const dataDir = path.resolve(__dirname, 'data');
    const authDir = path.join(dataDir, 'auth');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    state.status = 'connecting';

    // Load WhatsApp authentication session
    const {
      state: authState,
      saveCreds
    } = await useMultiFileAuthState(authDir);

    // Get compatible WhatsApp Web version
    const { version } = await fetchLatestBaileysVersion();

    console.log('Using Baileys version:', version);

    const logger = pino({
      level: process.env.LOG_LEVEL || 'info'
    });

    // Create WhatsApp connection
    const bot = makeWASocket({
      version,
      logger,
      auth: authState,

      browser: Browsers.ubuntu(
        config.BOT_NAME || 'BALDWIN-BOT'
      ),

      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true
    });

    state.bot = bot;

    /*
     * Load commands
     */
    try {
      const commandsPath = path.join(__dirname, 'commands');

      state.commands = loadCommands(commandsPath);

      console.log(
        `Commands loaded: ${state.commands?.size || 0}`
      );
    } catch (error) {
      console.error(
        'Command loader failed:',
        error.message
      );

      state.commands = new Map();
    }

    /*
     * Update bot profile
     */
    async function setBotProfile(sock) {
      try {
        if (!sock.user) {
          return;
        }

        // Only update name when configured
        if (config.BOT_NAME) {
          try {
            await sock.updateProfileName(
              config.BOT_NAME
            );
          } catch (error) {
            console.warn(
              'Could not update profile name:',
              error.message
            );
          }
        }

        // Optional profile picture
        if (config.PROFILE_PICTURE) {
          try {
            const response = await axios.get(
              config.PROFILE_PICTURE,
              {
                responseType: 'arraybuffer',
                timeout: 15000
              }
            );

            const image = Buffer.from(
              response.data
            );

            await sock.updateProfilePicture(
              sock.user.id,
              image
            );
          } catch (error) {
            console.warn(
              'Could not update profile picture:',
              error.message
            );
          }
        }
      } catch (error) {
        console.warn(
          'Profile update skipped:',
          error.message
        );
      }
    }

    /*
     * Pairing code
     */
    async function requestPairingCode(sock) {
      try {
        if (!config.OWNER_NUMBER) {
          console.log(
            'OWNER_NUMBER not configured. QR login will be used.'
          );
          return;
        }

        // Remove +, spaces, -, etc.
        const phoneNumber = String(
          config.OWNER_NUMBER
        ).replace(/\D/g, '');

        if (!phoneNumber) {
          console.log(
            'Invalid OWNER_NUMBER. QR login will be used.'
          );
          return;
        }

        const code =
          await sock.requestPairingCode(
            phoneNumber
          );

        state.pairingCode = code;

        console.log(
          'Your WhatsApp pairing code is:',
          code
        );

        if (global.__botLog) {
          global.__botLog(
            `Pairing code: ${code}`
          );
        }
      } catch (error) {
        console.warn(
          'Pairing code request failed:',
          error.message
        );
      }
    }

    /*
     * Save authentication credentials
     */
    bot.ev.on(
      'creds.update',
      saveCreds
    );

    /*
     * Connection events
     */
    bot.ev.on(
      'connection.update',
      async (update) => {
        const {
          connection,
          lastDisconnect,
          qr
        } = update;

        /*
         * QR generated
         */
        if (qr) {
          state.status = 'qr';
          state.qr = qr;

          console.log(
            'WhatsApp QR code generated.'
          );

          try {
            const qrPath = path.join(
              dataDir,
              'qrcode.png'
            );

            await QRCode.toFile(
              qrPath,
              qr
            );

            console.log(
              'QR saved to:',
              qrPath
            );
          } catch (error) {
            console.warn(
              'Could not save QR image:',
              error.message
            );
          }

          try {
            const terminalQR =
              await QRCode.toString(
                qr,
                {
                  type: 'terminal',
                  small: true
                }
              );

            console.log(terminalQR);
          } catch (error) {
            console.warn(
              'Could not print QR:',
              error.message
            );
          }
        }

        /*
         * WhatsApp connected
         */
        if (connection === 'open') {
          state.status = 'online';
          state.qr = null;
          state.pairingCode = null;

          console.log(
            'WhatsApp connection opened successfully.'
          );

          if (reconnectTimer) {
            clearTimeout(
              reconnectTimer
            );

            reconnectTimer = null;
          }

          try {
            await setBotProfile(bot);
          } catch (error) {
            console.warn(
              'Profile setup error:',
              error.message
            );
          }

          return;
        }

        /*
         * WhatsApp disconnected
         */
        if (connection === 'close') {
          state.status =
            'disconnected';

          const statusCode =
            lastDisconnect?.error?.output
              ?.statusCode ||
            lastDisconnect?.error
              ?.statusCode;

          console.log(
            'WhatsApp connection closed.'
          );

          console.log(
            'Status code:',
            statusCode
          );

          const loggedOut =
            statusCode ===
            DisconnectReason.loggedOut;

          if (loggedOut) {
            state.status =
              'logged-out';

            console.log(
              'WhatsApp session logged out.'
            );

            console.log(
              'Delete the data/auth folder and pair the bot again.'
            );

            return;
          }

          console.log(
            'Attempting reconnection in 5 seconds...'
          );

          if (!reconnectTimer) {
            reconnectTimer =
              setTimeout(
                async () => {
                  reconnectTimer = null;

                  try {
                    await startBot({
                      state,
                      config
                    });
                  } catch (error) {
                    console.error(
                      'Reconnect failed:',
                      error
                    );
                  }
                },
                5000
              );
          }
        }
      }
    );

    /*
     * Incoming messages
     */
    bot.ev.on(
      'messages.upsert',
      async ({ messages }) => {
        try {
          if (
            !messages ||
            !messages.length
          ) {
            return;
          }

          const msg = messages[0];

          if (
            !msg ||
            !msg.message
          ) {
            return;
          }

          // Ignore messages sent by the bot itself
          if (msg.key?.fromMe) {
            return;
          }

          const remoteJid =
            msg.key?.remoteJid;

          if (!remoteJid) {
            return;
          }

          // Extract text from common WhatsApp
          // message types
          const text =
            msg.message
              ?.conversation ||
            msg.message
              ?.extendedTextMessage
              ?.text ||
            msg.message
              ?.imageMessage
              ?.caption ||
            msg.message
              ?.videoMessage
              ?.caption ||
            '';

          if (!text) {
            return;
          }

          const prefix =
            config.PREFIX || '.';

          const trimmed =
            text.trim();

          if (
            !trimmed.startsWith(
              prefix
            )
          ) {
            return;
          }

          const commandText =
            trimmed
              .slice(prefix.length)
              .trim();

          if (!commandText) {
            return;
          }

          const args =
            commandText.split(/\s+/);

          const commandName =
            args
              .shift()
              ?.toLowerCase();

          if (!commandName) {
            return;
          }

          let commands =
            state.commands;

          if (
            !commands ||
            typeof commands.get !==
              'function'
          ) {
            try {
              commands =
                loadCommands(
                  path.join(
                    __dirname,
                    'commands'
                  )
                );

              state.commands =
                commands;
            } catch (error) {
              console.error(
                'Could not load commands:',
                error
              );

              return;
            }
          }

          let cmd =
            commands.get(
              commandName
            );

          // Check command aliases
          if (!cmd) {
            cmd = [
              ...commands.values()
            ].find((entry) => {
              const aliases =
                entry.aliases || [];

              return aliases
                .map((alias) =>
                  String(
                    alias
                  ).toLowerCase()
                )
                .includes(
                  commandName
                );
            });
          }

          if (!cmd) {
            return;
          }

          try {
            const ownerNumber =
              String(
                config.OWNER_NUMBER ||
                  ''
              ).replace(/\D/g, '');

            const isOwner =
              remoteJid ===
                config.OWNER_JID ||
              (
                ownerNumber &&
                remoteJid.includes(
                  ownerNumber
                )
              );

            await cmd.run({
              bot,
              msg,
              args,
              text: trimmed,
              config,
              state,
              prefix,
              isOwner
            });
          } catch (error) {
            console.error(
              `Command "${commandName}" failed:`,
              error
            );

            try {
              await bot.sendMessage(
                remoteJid,
                {
                  text:
                    'Something went wrong while running this command.'
                }
              );
            } catch (
              sendError
            ) {
              console.error(
                'Could not send command error message:',
                sendError.message
              );
            }
          }
        } catch (error) {
          console.error(
            'messages.upsert error:',
            error
          );
        }
      }
    );

    /*
     * Make bot available globally
     * for modules that expect it.
     */
    global.__bot = bot;
    global.__botState = state;

    /*
     * Pairing code is optional.
     *
     * Set USE_PAIRING_CODE=true
     * in the environment if you
     * want pairing-code login.
     */
    if (
      String(
        process.env
          .USE_PAIRING_CODE ||
          ''
      ).toLowerCase() ===
        'true' &&
      !authState.creds.registered
    ) {
      setTimeout(
        () =>
          requestPairingCode(
            bot
          ),
        3000
      );
    }

    return bot;
  } catch (error) {
    state.status = 'error';

    console.error(
      'startBot failed:',
      error
    );

    throw error;
  }
}

module.exports = {
  startBot
};
