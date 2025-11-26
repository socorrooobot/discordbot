import { getDiscordClient } from './discord.js';
import { chat } from './gemini.js';
import { handleCommand, shouldAutoRespond, shouldRespondToMention } from './commands.js';

async function main() {
  console.log('Starting Discord bot...');
  
  try {
    const client = await getDiscordClient();
    
    client.once('ready', () => {
      console.log(`✨ Bot is online! Logged in as ${client.user.tag}`);
      console.log(`🖤 Bot is in ${client.guilds.cache.size} server(s)`);
      client.user.setActivity('seus sussurros...', { type: 'LISTENING' });
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      // Tentar executar comando
      if (message.content.startsWith('!')) {
        const wasHandled = await handleCommand(message, client);
        if (wasHandled) return;
      }

      // Responder automaticamente para usuário específico
      if (shouldAutoRespond(message)) {
        await message.channel.sendTyping();
        try {
          const response = await chat(message.author.id, message.content);
          
          if (response.length > 2000) {
            const chunks = response.match(/.{1,2000}/gs);
            for (const chunk of chunks) {
              await message.reply(chunk);
            }
          } else {
            await message.reply(response);
          }
        } catch (error) {
          console.error('AI Error:', error);
        }
        return;
      }

      // Responder quando mencionado
      if (shouldRespondToMention(message, client)) {
        const question = message.content.replace(/<@!?\d+>/g, '').trim();
        if (!question) {
          await message.reply('Oi! Me pergunte qualquer coisa ou use `!ajuda` para ver meus comandos.');
          return;
        }

        await message.channel.sendTyping();
        
        try {
          const response = await chat(message.author.id, question);
          
          if (response.length > 2000) {
            const chunks = response.match(/.{1,2000}/gs);
            for (const chunk of chunks) {
              await message.reply(chunk);
            }
          } else {
            await message.reply(response);
          }
        } catch (error) {
          console.error('AI Error:', error);
          await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo! 🖤');
        }
      }
    });

    process.on('SIGINT', () => {
      console.log('💀 Shutting down bot...');
      client.destroy();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
