// bot.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const dotenv = require('dotenv');
const commandHandler = require('./handlers/commandHandler');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.commands = new Collection();

client.once('ready', () => {
  console.log(`${client.user.tag} is online.`);
});

commandHandler(client);

client.login(process.env.DISCORD_TOKEN);