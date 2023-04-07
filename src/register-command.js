require("dotenv").config();
const { REST, Routes, Client, IntentsBitField } = require("discord.js");

const commands = [
  {
    name: "help",
    description: "Learn how to use NorPT.",
  },
];

const rest = new REST({ version: 10 }).setToken(process.env.DISCORD_TOKEN);

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
});

(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Slash commands were registered successfully!");
  } catch (e) {
    console.log(e);
  }
})();

client.login(process.env.DISCORD_TOKEN);
