import { getDiscordClient } from './discord.js';
import { chat } from './gemini.js';
import { handleCommand, shouldRespondToMention } from './commands.js';
import { addXP } from './xp.js';
import { isAFK, removeAFK } from './afk.js';
import { registerSlashCommands } from './slashCommands.js';
import { getTimeUntilDaily, getAllUsers } from './economy.js';
import { isBlacklisted } from './blacklist.js';
import { notifyRestart } from './restartNotification.js';
import { sendGoodbyeMessage } from './goodbyeMessage.js';
import { EmbedBuilder } from 'discord.js';
import { loadTickets, createTicket, closeTicket, claimTicket } from './tickets.js';

async function main() {
  console.log('Starting Discord bot...');

  try {
    const client = await getDiscordClient();

    client.once('ready', async () => {
      console.log(`✨ Bot is online! Logged in as ${client.user.tag}`);
      console.log(`🖤 Bot is in ${client.guilds.cache.size} server(s)`);

      // Notificar reinicialização
      await notifyRestart(client, 'Reinicialização do bot');

      // Registrar slash commands
      await registerSlashCommands(client);

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
        try {
          await message.reply('❌ Você está na blacklist e não pode usar o bot.');
        } catch (error) {
          console.error('Erro ao enviar mensagem de blacklist:', error);
        }
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

        try {
          await message.reply({ embeds: [afkRemoveEmbed] });
        } catch (error) {
          console.error('Erro ao enviar embed de AFK:', error);
        }
      }

      // Verificar se mencionou alguém AFK
      const mentions = message.mentions.users;
      for (const [userId, user] of mentions) {
        const afkData = isAFK(userId);
        if (afkData && message.author.id !== client.user.id) {
          try {
            await message.reply(`🌑 **${user.username} está AFK!**\n\n**Motivo:** ${afkData.reason}`);
          } catch (error) {
            console.error('Erro ao avisar sobre AFK:', error);
          }
          break;
        }
      }

      // Sistema de XP
      try {
        const result = await addXP(message.author.id);
        if (result.leveledUp) {
          try {
            await message.author.send(`🖤 **Parabéns!** Você subiu para o **nível ${result.newLevel}**!\n\n*Você compreendeu mais sobre você mesma...* 💀`);
          } catch (error) {
            console.error('Erro ao enviar DM de level up:', error);
          }
        }
      } catch (error) {
        console.error('Erro no sistema de XP:', error);
      }

      // PRIMEIRO: Verificar se é um comando com prefixo !
      if (message.content.startsWith('!')) {
        try {
          // Evitar processamento duplo se houver múltiplas instâncias ou eventos
          if (message.client.lastProcessedMessageId === message.id) return;
          message.client.lastProcessedMessageId = message.id;

          const wasHandled = await handleCommand(message, client);
          if (wasHandled) return; // Se comando foi executado, PARA AQUI
        } catch (error) {
          console.error('Erro ao executar comando:', error);
          try {
            await message.reply('❌ Ocorreu um erro ao executar o comando.');
          } catch (e) {
            console.error('Erro ao enviar mensagem de erro:', e);
          }
          return;
        }
      }

      // SEGUNDO: Só responde a menções se NÃO for comando
      if (shouldRespondToMention(message, client) && !message.content.startsWith('!')) {
        const question = message.content.replace(/<@!?\d+>/g, '').trim();
        if (!question) {
          try {
            await message.reply('Oi! Me pergunte qualquer coisa ou use `!ajuda` para ver meus comandos.');
          } catch (error) {
            console.error('Erro ao responder menção vazia:', error);
          }
          return;
        }

        try {
          await message.channel.sendTyping();
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
          try {
            await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo! 🖤');
          } catch (e) {
            console.error('Erro ao enviar mensagem de erro da IA:', e);
          }
        }
      }
    });

    client.on('interactionCreate', async (interaction) => {
      // SLASH COMMANDS (prioridade)
      if (interaction.isChatInputCommand()) {
        const { slashCommands } = await import('./slashCommands.js');
        const command = slashCommands[interaction.commandName];
        if (command) {
          try {
            await command.execute(interaction);
          } catch (error) {
            console.error(`Erro ao executar slash command ${interaction.commandName}:`, error);
            const { EmbedBuilder } = await import('discord.js');
            const errorEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('❌ Erro')
              .setDescription('Houve um erro ao executar este comando.');
            
            if (interaction.replied || interaction.deferred) {
              await interaction.editReply({ embeds: [errorEmbed] });
            } else {
              await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
          }
        }
        return;
      }

      // BUTTONS
      if (!interaction.isButton()) return;

      const customId = interaction.customId;

      // Sistema de Tickets
      if (customId === 'open_ticket') {
        await createTicket(interaction);
        return;
      }

      if (customId.startsWith('close_ticket_')) {
        const ticketId = customId.replace('close_ticket_', '');
        await closeTicket(interaction, ticketId);
        return;
      }

      if (customId.startsWith('claim_ticket_')) {
        const ticketId = customId.replace('claim_ticket_', '');
        await claimTicket(interaction, ticketId);
        return;
      }

      // Sistema de Cinema
      if (interaction.customId.startsWith('vote_movie_')) {
        const { handleCinemaVote } = await import('./cinema.js');
        await handleCinemaVote(interaction);
        return;
      }

      // Sistema de Casamento/Divórcio
      if (interaction.customId === 'cancel_marriage') {
        await interaction.update({ content: '💔 Casamento cancelado!', components: [], embeds: [] });
        return;
      }

      if (interaction.customId.startsWith('accept_marriage_')) {
        const { handleMarriageAccept } = await import('./rpCommands.js');
        await handleMarriageAccept(interaction);
        return;
      }

      if (interaction.customId.startsWith('accept_divorce_')) {
        const { handleDivorceAccept } = await import('./rpCommands.js');
        await handleDivorceAccept(interaction);
        return;
      }

      if (interaction.customId === 'cancel_divorce') {
        await interaction.update({ content: '💙 Divórcio cancelado! O amor continua!', components: [], embeds: [] });
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