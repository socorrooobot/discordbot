import { getDiscordClient } from './discord.js';
import { chat } from './gemini.js';
import { handleCommand, shouldRespondToMention } from './commands.js';
import { addXP } from './xp.js';
import { isAFK, removeAFK } from './afk.js';
import { registerSlashCommands, setupSlashCommandHandler } from './slashCommands.js';
import { getTimeUntilDaily, getAllUsers } from './economy.js';
import { isBlacklisted } from './blacklist.js';
import { notifyRestart } from './restartNotification.js';
import { sendGoodbyeMessage } from './goodbyeMessage.js';
import { EmbedBuilder } from 'discord.js';
import { createTicket, closeTicket, claimTicket } from './tickets.js';

async function main() {
  console.log('Starting Discord bot...');

  try {
    const client = await getDiscordClient();

    client.once('ready', async () => {
      console.log(`✨ Bot is online! Logged in as ${client.user.tag}`);
      console.log(`🖤 Bot is in ${client.guilds.cache.size} server(s)`);

      // Notificar reinicialização
      await notifyRestart(client, 'Reinicialização do bot');

      // Registrar slash commands e handlers
      await registerSlashCommands(client);
      await setupSlashCommandHandler(client);

      // Iniciar Dashboard Web
      try {
        const { startDashboard } = await import('./dashboard.js');
        startDashboard(client);
      } catch (error) {
        console.error('⚠️ Erro ao iniciar dashboard:', error);
        console.log('✅ Bot continuará funcionando sem dashboard');
      }

      const getActivities = () => [
        { text: `estou em ${client.guilds.cache.size} servidores`, type: 'WATCHING' },
        { text: 'use !cmds para ajuda', type: 'LISTENING' },
        { text: 'vamos cantar juntos', type: 'PLAYING' },
        { text: 'Servidor de Suporte: discord.gg/PNwfyVc2ns', type: 'LISTENING' }
      ];

      let currentActivity = 0;

      // Atualizar atividade imediatamente
      let activities = getActivities();
      client.user.setActivity(activities[currentActivity].text, { type: activities[currentActivity].type });

      // Mudar atividade a cada 30 segundos (recalculando para pegar servidores atualizados)
      setInterval(() => {
        currentActivity = (currentActivity + 1) % 4;
        activities = getActivities(); // Recalcula para pegar número de servidores atualizado
        client.user.setActivity(activities[currentActivity].text, { type: activities[currentActivity].type });
      }, 30000);

      // Sistema de notificação de daily disponível
      const notifiedUsers = new Set();

      setInterval(async () => {
        try {
          const users = getAllUsers();

          for (const [userId, userData] of Object.entries(users)) {
            const timeUntil = getTimeUntilDaily(userId);

            // Se daily está disponível e ainda não notificou
            if (timeUntil === 0 && !notifiedUsers.has(userId)) {
              try {
                const user = await client.users.fetch(userId);
                const dailyNotifyEmbed = new EmbedBuilder()
                  .setColor('#00bfff')
                  .setTitle('✨ Seu Daily está Disponível!')
                  .setDescription('*Vamos cantar e ganhar moedas!* 🎵\n\nUse `/daily` ou `!daily` para receber seus **50 Akita Neru**!')
                  .setFooter({ text: '*Fufu~ Mais um dueto! 💙' });

                await user.send({ embeds: [dailyNotifyEmbed] });
                notifiedUsers.add(userId);
              } catch (error) {
                console.error(`Erro ao enviar DM para ${userId}:`, error);
              }
            }

            // Remover do set se daily não está mais disponível
            if (timeUntil > 0) {
              notifiedUsers.delete(userId);
            }
          }
        } catch (error) {
          console.error('Erro no sistema de daily notification:', error);
        }
      }, 3600000); // Verifica a cada hora (3600000 ms)
    });

    client.on('messageCreate', async (message) => {
      // Ignorar mensagens de bots
      if (message.author.bot) return;

      console.log(`📨 Mensagem recebida de ${message.author.tag}: ${message.content.substring(0, 50)}`);

      // Verificar se usuário está na blacklist
      if (isBlacklisted(message.author.id)) {
        await message.reply('sai daqui voce ta na black list');
        return;
      }

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

      // PRIMEIRO: Verificar se é um comando com prefixo !
      if (message.content.startsWith('!')) {
        const wasHandled = await handleCommand(message, client);
        if (wasHandled) return; // Se comando foi executado, PARA AQUI
      }

      // SEGUNDO: Só responde a menções se NÃO for comando
      // Agora verificamos se a mensagem NÃO começa com ! antes de processar menção
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

    // Handler de botões de tickets
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      const customId = interaction.customId;

      // Abrir ticket
      if (customId === 'open_ticket') {
        await createTicket(interaction);
        return;
      }

      // Fechar ticket
      if (customId.startsWith('close_ticket_')) {
        const ticketId = customId.replace('close_ticket_', '');
        await closeTicket(interaction, ticketId);
        return;
      }

      // Assumir ticket
      if (customId.startsWith('claim_ticket_')) {
        const ticketId = customId.replace('claim_ticket_', '');
        await claimTicket(interaction, ticketId);
        return;
      }
    });

    client.on('guildMemberAdd', async (member) => {
      if (member.user.bot) return;
      
      try {
        const { applyAutoRole } = await import('./autorole.js');
        await applyAutoRole(member);
      } catch (error) {
        console.error('Erro ao aplicar autorole:', error);
      }
    });

    client.on('guildMemberRemove', async (member) => {
      if (member.user.bot) return;
      await sendGoodbyeMessage(client, member.user);
    });

    const shutdownHandler = async (signal) => {
      console.log(`💀 Shutting down bot... (${signal})`);
      
      // Enviar notificação de shutdown
      try {
        const channelId = '1439242814763307091';
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          const embed = {
            color: 0xFF0000,
            title: '🔴 Bot Ficando Offline',
            description: '⚠️ A Miku Diva está sendo desligada!',
            fields: [
              { name: '📝 Motivo', value: 'Processo encerrado (manutenção ou restart)', inline: false },
              { name: '⏱️ Status', value: '🔴 Ficando offline agora...', inline: false }
            ],
            footer: { text: 'Até logo! 💙' },
            timestamp: new Date().toISOString()
          };
          
          await channel.send({ embeds: [embed] });
          console.log('✅ Notificação de shutdown enviada!');
        }
      } catch (error) {
        console.error('Erro ao enviar notificação de shutdown:', error);
      }
      
      // Aguardar um pouco para garantir que a mensagem foi enviada
      setTimeout(() => {
        client.destroy();
        process.exit(0);
      }, 1000);
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();