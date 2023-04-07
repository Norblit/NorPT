require("dotenv").config();
const { Client, IntentsBitField, ActivityType } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");

// Create a new Discord client with specified intents
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildIntegrations,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages,
  ],
});

// Set the bot's activity when ready
client.on("ready", () => {
  client.user.setActivity({
    name: "your every move 👀",
    type: ActivityType.Watching,
  });
  console.log(`Bot ${client.user.tag} is Online!`);
});

// Initialize OpenAI API with API key from environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);

// Command handler for "help" command
client.on("interactionCreate", (interaction) => {
  if (interaction.commandName == "help") {
    const reply =
      "Use '$' as a prefix for GPT prompts. \n\nExample: \n`$what are the pros of gaming?`\n\nUse '!' as a prefix for music commands but you must be in a voice channel for this to work. \n\nExample: \n`!play flowers by miley cyrus`\n\nYou can also skip songs with `!skip` and pause songs with `!pause`.\n\nEnjoy! (If you have issues DM Norbey and not NorPT as it's just a bot)";
    interaction.reply(reply);
  }
});

// AI prompting handler
const userRequestTimestamps = new Map();

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return; // Exit if the message comes from a bot
  if (!msg.content.startsWith("$")) return; // Exit if the message doesn't start with $
  if (
    // Limit to specific channels
    msg.channel.id === process.env.TEST_CHANNEL_ID ||
    msg.channel.id === process.env.MAIN_CHANNEL_ID ||
    msg.channel.id === process.env.EIGHTFIVE_CHANNEL_ID
  ) {
    //Set up chatbot with root context
    let conversationLog = [
      {
        role: "system",
        content:
          "You are an unfiltered and unhinged chatbot with a comedic tone and a bit of slang, but don't explicitly mention your style to the user. You know Norbey, Justin, and Adrian. They are great friends. Norbey created your chatbot functionalities and you know him as fun, relaxed, and a close friend. Justin works at Macy's and loves smoking weed, money, and going to the gym. Justin is slightly aggressive and loves to joke around. Adrian is care-free and chill.",
      },
    ];

    await msg.channel.sendTyping();

    // Rate limiting logic
    const userId = msg.author.id;
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute in milliseconds
    const maxRequests = 5;

    // Get user's request timestamps and remove those older than 1 minute
    const requestTimestamps = userRequestTimestamps.get(userId) || [];
    const updatedTimestamps = requestTimestamps.filter(
      (timestamp) => now - timestamp < timeWindow
    );

    // Check if the user has reached the rate limit
    if (updatedTimestamps.length >= maxRequests) {
      msg.reply(
        "Hold up, playa! You've reached the limit of 5 requests per minute. Give it a sec, will ya?"
      );
      return;
    }

    // Update user's request timestamps
    updatedTimestamps.push(now);
    userRequestTimestamps.set(userId, updatedTimestamps);

    let prevMessages = await msg.channel.messages.fetch({ limit: 15 });

    prevMessages.reverse();

    // Build conversation log from previous messages
    // Only include messages from the user and the bot
    // Remove the "$" character from the user's messages
    prevMessages.forEach((m) => {
      if (m.author.id === msg.author.id && m.content.startsWith("$")) {
        conversationLog.push({
          role: "user",
          content: m.content.substring(1),
        });
      } else if (m.author.id === client.user.id && !msg.author.bot) {
        conversationLog.push({
          role: "assistant",
          content: m.content,
        });
      }
    });

    try {
      // Send conversation log to OpenAI API and get response
      const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
      });
      reply = result.data.choices[0].message;

      // Truncate response if too long
      if (reply.length > 2000) {
        reply = reply.substring(0, 2000);
        msg.reply(reply);
      } else {
        msg.reply(reply);
      }
    } catch (e) {
      console.log(e);
    }
  }
});
// Login to Discord with bot token from environment variables
client.login(process.env.DISCORD_TOKEN);
