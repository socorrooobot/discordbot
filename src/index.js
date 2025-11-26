import { getDiscordClient } from './discord.js';

async function main() {
  console.log('Starting Discord bot...');
  
  try {
    const client = await getDiscordClient();
    
    client.once('ready', () => {
      console.log(`Bot is online! Logged in as ${client.user.tag}`);
      console.log(`Bot is in ${client.guilds.cache.size} server(s)`);
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      if (message.content.toLowerCase() === '!ping') {
        await message.reply('Pong!');
      }

      if (message.content.toLowerCase() === '!hello') {
        await message.reply(`Hello, ${message.author.username}!`);
      }

      if (message.content.toLowerCase() === '!help') {
        await message.reply(
          '**Available Commands:**\n' +
          '`!ping` - Check if the bot is responsive\n' +
          '`!hello` - Get a friendly greeting\n' +
          '`!help` - Show this help message'
        );
      }
    });

    process.on('SIGINT', () => {
      console.log('Shutting down bot...');
      client.destroy();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
