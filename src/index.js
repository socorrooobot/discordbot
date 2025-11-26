import { getDiscordClient } from './discord.js';
import { chat, clearHistory } from './gemini.js';

async function main() {
  console.log('Starting Discord bot...');
  
  try {
    const client = await getDiscordClient();
    
    client.once('clientReady', () => {
      console.log(`Bot is online! Logged in as ${client.user.tag}`);
      console.log(`Bot is in ${client.guilds.cache.size} server(s)`);
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.toLowerCase();

      if (content === '!ping') {
        await message.reply('Pong!');
        return;
      }

      if (content === '!hello' || content === '!ola' || content === '!olá') {
        await message.reply(`Olá, ${message.author.username}! Tudo bem?`);
        return;
      }

      if (content === '!clear' || content === '!limpar') {
        clearHistory(message.author.id);
        await message.reply('Seu histórico de conversa foi limpo!');
        return;
      }

      if (content === '!help' || content === '!ajuda') {
        await message.reply(
          '**Comandos Disponíveis:**\n' +
          '`!ask <pergunta>` - Pergunte qualquer coisa para a IA\n' +
          '`!limpar` - Limpar seu histórico de conversa\n' +
          '`!ping` - Verificar se o bot está respondendo\n' +
          '`!ola` - Receber uma saudação\n' +
          '`!ajuda` - Mostrar esta mensagem\n\n' +
          '*Você também pode me mencionar para conversar!*'
        );
        return;
      }

      if (content.startsWith('!ask ') || content.startsWith('!pergunte ')) {
        const question = message.content.slice(content.startsWith('!ask ') ? 5 : 10).trim();
        if (!question) {
          await message.reply('Por favor, faça uma pergunta! Use: `!ask <sua pergunta>`');
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
          await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo!');
        }
        return;
      }

      if (message.mentions.has(client.user) && !content.startsWith('!')) {
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
          await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo!');
        }
        return;
      }

      // Responder automaticamente a mensagens normais (não comandos)
      if (!content.startsWith('!')) {
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
