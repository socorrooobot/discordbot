import { getDiscordClient } from './discord.js';
import { chat } from './gemini.js';
import { handleCommand, shouldAutoRespond, shouldRespondToMention } from './commands.js';
import { addXP } from './xp.js';
import { isAFK, removeAFK } from './afk.js';
import { registerSlashCommands } from './slashCommands.js';
import { EmbedBuilder } from 'discord.js';

async function main() {
  console.log('Starting Discord bot...');
  
  try {
    const client = await getDiscordClient();
    
    client.once('ready', () => {
      console.log(`✨ Bot is online! Logged in as ${client.user.tag}`);
      console.log(`🖤 Bot is in ${client.guilds.cache.size} server(s)`);
      
      const getActivities = () => [
        { text: `estou em ${client.guilds.cache.size} servidores`, type: 'WATCHING' },
        { text: 'use !cmds para ajuda', type: 'LISTENING' },
        { text: 'sou somente uma diva', type: 'PLAYING' }
      ];
      
      let currentActivity = 0;
      const activities = getActivities();
      
      client.user.setActivity(activities[currentActivity].text, { type: activities[currentActivity].type });
      
      setInterval(() => {
        currentActivity = (currentActivity + 1) % activities.length;
        client.user.setActivity(activities[currentActivity].text, { type: activities[currentActivity].type });
      }, 30000); // Muda a cada 30 segundos
    });

    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      // Verificar se pessoa AFK escreveu algo
      const userAFK = isAFK(message.author.id);
      if (userAFK && !message.content.startsWith('!')) {
        removeAFK(message.author.id);
        
        try {
          const member = await message.guild.members.fetch(message.author.id);
          await member.setNickname(null);
        } catch (error) {
          console.error('Erro ao remover nick AFK:', error);
        }

        const afkRemoveEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle('🎭 Você voltou!')
          .setDescription('*Saiu do vazio...*')
          .setFooter({ text: 'Bem-vindo de volta ao mundo das vivas. 🖤' });
        
        await message.reply({ embeds: [afkRemoveEmbed] });
      }

      // Verificar se mencionou alguém AFK
      const mentions = message.mentions.users;
      for (const [userId, user] of mentions) {
        const afkData = isAFK(userId);
        if (afkData && message.author.id !== client.user.id) {
          await message.reply(`🌑 **${user.username} está AFK!**\n\n**Motivo:** ${afkData.reason}`);
          break;
        }
      }

      // Sistema de XP
      const xpResult = addXP(message.author.id);
      if (xpResult.leveledUp) {
        try {
          await message.author.send(`🖤 **Parabéns!** Você subiu para o **nível ${xpResult.newLevel}**!\n\n*Você compreendeu mais sobre você mesma...* 💀`);
        } catch (error) {
          console.error('Erro ao enviar DM de level up:', error);
        }
      }

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
