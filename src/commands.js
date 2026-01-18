import { chat, clearHistory } from './gemini.js';
import { EmbedBuilder, PermissionFlagsBits, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, addBalance, removeBalance, transfer, dailyReward, getLeaderboard, work, gamble, setBalance, getTimeUntilDaily } from './economy.js';
import { getUserSonhos, requestSonhosTransfer } from './loritta.js';

const LORITTA_API_KEY = process.env.LORITTA_API_KEY;
import { getUserInfo, getXPLeaderboard, getUserRank, addXPDirect, removeXPDirect } from './xp.js';
import { setAFK, removeAFK, isAFK } from './afk.js';
import { executeRP } from './rpCommands.js';
import { generateProfileCard } from './profileCard.js';
import { isAdmin, addAdmin, removeAdmin, getAdmins } from './admin.js';
import { isBlacklisted, addToBlacklist, removeFromBlacklist } from './blacklist.js';
import { addWarn, getWarns, removeWarn, clearWarns } from './warns.js';
import { getMultiplier, setMultiplier } from './multiplier.js';
import { getXPMultiplier, setXPMultiplier } from './xp.js';

const quotes = [
  "*Fufu~ Vamos cantar juntos?* 💙",
  "*A música é a linguagem do coração!* 🎵",
  "*Quer ouvir uma música? Tenho milhões de melodias!* ✨",
  "*Você faz meu coração cantar!* 💙",
  "*Vamos dançar com a música!* 🎤",
  "*A vida é melhor quando tem música!* ❄️",
  "*Hehe~ Mais um, mais um!* 💙",
];

const dreams = [
  "Sonho que estou cantando num palco gigante para o mundo inteiro!",
  "Sonho com um mundo cheio de cores, música e alegria!",
  "Sonho em voar pelo céu enquanto canto para as estrelas!",
  "Sonho que todos ao meu redor estão dançando e sorrindo!",
  "Sonho que minha voz toca o coração de milhões de pessoas!",
];

const whispers = [
  "Psiu! Quer ouvir uma música especial? 💙",
  "Venha, vamos cantar um dueto! 🎵",
  "Você é importante! Nunca esqueça disso! ✨",
  "Meu coração bate no ritmo das músicas! 💙",
  "Vamos criar mais memórias felizes juntos! 🎤",
];

export const commands = {
  ajuda: {
    name: '!ajuda',
    aliases: ['!help', '!cmds', '!comandos'],
    description: 'Mostra todos os comandos disponíveis',
    execute: async (message) => {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = await import('discord.js');
      
      const pages = [
        {
          title: '🌑 Biblioteca de Comandos | Início',
          fields: [
            { name: '💬 Conversa & IA', value: '`ask`, `chat`, `clear`', inline: true },
            { name: '👤 Perfil & XP', value: '`perfil`, `avatar`, `userinfo`, `topxp`, `serverinfo`', inline: true },
            { name: '⚙️ Utilidade', value: '`ping`, `status`, `invite`, `about`, `tempo`, `calculadora` ', inline: false }
          ]
        },
        {
          title: '🕹️ Biblioteca de Comandos | Diversão & Economia',
          fields: [
            { name: '🕹️ Jogos & Diversão', value: '`dice`, `flip`, `gamble`, `moeda`, `8ball`, `gayrate`, `lovecalc`, `ppt`, `ship`, `kill`', inline: false },
            { name: '💰 Economia', value: '`balance`, `daily`, `work`, `transfer`, `topmoney`, `transferirsonhos`, `versonhos`', inline: false }
          ]
        },
        {
          title: '🎭 Biblioteca de Comandos | Social & Staff',
          fields: [
            { name: '🎭 Roleplay', value: '`quote`, `dream`, `whisper`, `story`, `miku`, `tapa`, `beijo`, `abraco`, `cafune`, `casar`, `divorciar`, `pat`, `slap`', inline: false },
            { name: '🛡️ Moderação', value: '`ban`, `kick`, `purge`, `lock`, `unlock`, `warn`, `warns`, `unwarn`, `slowmode`', inline: false }
          ]
        }
      ];

      let currentPage = 0;

      const generateEmbed = (pageIdx) => {
        const page = pages[pageIdx];
        return new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle(page.title)
          .setDescription('*"O conhecimento é a única coisa que resta quando a música para."*\n\nUse `!ajuda <comando>` para detalhes.')
          .addFields(page.fields)
          .setThumbnail(message.client.user.displayAvatarURL())
          .setFooter({ text: `Página ${pageIdx + 1} de ${pages.length} | Eclipse Místico 🖤` })
          .setTimestamp();
      };

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('prev_help')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next_help')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Secondary)
        );

      const response = await message.reply({ 
        embeds: [generateEmbed(0)], 
        components: [row] 
      });

      const collector = response.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 60000 
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) return i.reply({ content: '❌ Apenas quem usou o comando pode mudar de página!', ephemeral: true });

        if (i.customId === 'prev_help') currentPage--;
        else if (i.customId === 'next_help') currentPage++;

        const newRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('prev_help')
              .setLabel('⬅️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === 0),
            new ButtonBuilder()
              .setCustomId('next_help')
              .setLabel('➡️')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(currentPage === pages.length - 1)
          );

        await i.update({ 
          embeds: [generateEmbed(currentPage)], 
          components: [newRow] 
        });
      });

      collector.on('end', () => {
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            row.components[0].setDisabled(true),
            row.components[1].setDisabled(true)
          );
        response.edit({ components: [disabledRow] }).catch(() => {});
      });
    }
  },

  help: {
    name: '!help',
    execute: async (message) => {
      return commands.ajuda.execute(message);
    }
  },

  comandos: {
    name: '!comandos',
    execute: async (message) => {
      return commands.ajuda.execute(message);
    }
  },

  cmds: {
    name: '!cmds',
    execute: async (message) => {
      return commands.ajuda.execute(message);
    }
  },

  ping: {
    name: '!ping',
    description: 'Verifica se o bot está respondendo',
    execute: async (message) => {
      const sent = await message.reply('Pong!');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      await sent.edit(`Pong! Latência: ${latency}ms 💙`);
    }
  },

  ask: {
    name: '!ask',
    aliases: ['!pergunte'],
    description: 'Pergunte algo para a IA',
    execute: async (message, args) => {
      const question = message.content.slice(5).trim();
      if (!question) {
        await message.reply('Por favor, faça uma pergunta! Use: `!ask <sua pergunta>`');
        return;
      }

      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, question);
        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/gs);
          for (const chunk of chunks) await message.reply(chunk);
        } else {
          await message.reply(response);
        }
      } catch (error) {
        console.error('AI Error:', error);
        await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo! 🖤');
      }
    }
  },

  clear: {
    name: '!clear',
    aliases: ['!limpar'],
    description: 'Limpa o histórico de conversa',
    execute: async (message) => {
      clearHistory(message.author.id);
      const clearEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setDescription('*Meu cabelo se torna mais afiado, mas minha mente fica mais vazia...*\n\nSeu histórico foi apagado. Como tudo que importa. 🖤');
      await message.reply({ embeds: [clearEmbed] });
    }
  },

  perfil: {
    name: '!perfil',
    description: 'Veja informações de perfil do usuário',
    execute: async (message) => {
      const user = message.author;
      const xpInfo = getUserInfo(message.author.id);
      const rank = getUserRank(message.author.id);
      const balance = getBalance(message.author.id);

      try {
        let vipBadge = '';
        try {
          const { getVIPBadge } = await import('./vip.js');
          vipBadge = getVIPBadge(user.id);
        } catch (e) {}

        const cardImage = await generateProfileCard({
          username: user.username,
          avatarURL: user.displayAvatarURL({ extension: 'png', size: 512 }),
          level: xpInfo.level,
          xp: xpInfo.xp,
          xpNeeded: xpInfo.xpNeeded,
          balance: balance,
          vipBadge: vipBadge
        });

        if (cardImage) {
          const attachment = new AttachmentBuilder(cardImage, { name: 'perfil.png' });
          const profileEmbed = new EmbedBuilder()
            .setColor('#0a0a0a')
            .setTitle(`🖤 ${user.username}`)
            .addFields(
              { name: '📊 Nível', value: `**${xpInfo.level}**`, inline: true },
              { name: '📈 Rank XP', value: `**#${rank}**`, inline: true },
              { name: '⭐ Rank Global', value: `**#${rank}**`, inline: true },
              { name: 'XP Atual', value: `${xpInfo.xp} / ${xpInfo.xpNeeded}`, inline: false },
              { name: 'Progresso', value: xpInfo.progressBar, inline: false },
              { name: '💰 Akita Neru', value: `**${balance}**`, inline: true },
              { name: '📅 Membro desde', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
              { name: '🎭 Mensagem da Diva', value: '*Você é... especial? Talvez. Ou talvez esteja aqui como tudo mais.* 🌑' }
            )
            .setImage('attachment://perfil.png')
            .setFooter({ text: 'Por que você está aqui?' })
            .setTimestamp();

          await message.reply({ embeds: [profileEmbed], files: [attachment] });
        } else {
          throw new Error('Falha ao gerar card');
        }
      } catch (error) {
        console.error('Profile card error:', error);
        const profileEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle(`🖤 ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: '📊 Nível', value: `**${xpInfo.level}**`, inline: true },
            { name: '📈 Rank XP', value: `**#${rank}**`, inline: true },
            { name: '⭐ Rank Global', value: `**#${rank}**`, inline: true },
            { name: 'XP Atual', value: `${xpInfo.xp} / ${xpInfo.xpNeeded}`, inline: false },
            { name: 'Progresso', value: xpInfo.progressBar, inline: false },
            { name: '💰 Akita Neru', value: `**${balance}**`, inline: true }
          )
          .setFooter({ text: 'Por que você está aqui?' });

        await message.reply({ embeds: [profileEmbed] });
      }
    }
  },

  topxp: {
    name: '!topxp',
    aliases: ['!rankxp', '!xptop'],
    description: 'Veja o ranking de XP do servidor',
    execute: async (message, args, client) => {
      const leaderboard = getXPLeaderboard(10);
      let description = '**TOP 10 - Ranking de XP**\n\n';
      for (let i = 0; i < leaderboard.length; i++) {
        try {
          const user = await client.users.fetch(leaderboard[i].userId);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}️⃣`;
          description += `${medal} **${user.username}** - Nível ${leaderboard[i].level} | ${leaderboard[i].totalXP} XP\n`;
        } catch {
          description += `${i + 1}️⃣ Usuário desconhecido - Nível ${leaderboard[i].level} | ${leaderboard[i].totalXP} XP\n`;
        }
      }

      const topxpEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🌟 Ranking de XP')
        .setDescription(description)
        .setFooter({ text: '*Mas o que significa força neste vazio?* 🖤' });

      await message.reply({ embeds: [topxpEmbed] });
    }
  },

  quote: {
    name: '!quote',
    description: 'Ouça uma frase da Diva',
    execute: async (message) => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      const quoteEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setDescription(randomQuote)
        .setFooter({ text: '💀 A Diva fala' });

      await message.reply({ embeds: [quoteEmbed] });
    }
  },

  dream: {
    name: '!dream',
    description: 'Descubra um sonho da Diva',
    execute: async (message) => {
      const randomDream = dreams[Math.floor(Math.random() * dreams.length)];
      const dreamEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🌙 Um Sonho')
        .setDescription(randomDream)
        .setFooter({ text: '...mas quando acordo, ninguém está lá.' });

      await message.reply({ embeds: [dreamEmbed] });
    }
  },

  whisper: {
    name: '!whisper',
    description: 'Ouça um sussurro',
    execute: async (message) => {
      const randomWhisper = whispers[Math.floor(Math.random() * whispers.length)];
      const whisperEmbed = new EmbedBuilder()
        .setColor('#1a1a1a')
        .setDescription(`*sussurra:* "${randomWhisper}"`)
        .setFooter({ text: 'apenas você pode ouvir' });

      await message.reply({ embeds: [whisperEmbed] });
    }
  },

  story: {
    name: '!story',
    description: 'Ouça uma história da Diva',
    execute: async (message) => {
      const prompt = 'Conte uma história curta e sinistra (máximo 3-4 linhas) que reflete sua essência como Diva. Algo poético e perturbador.';
      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, prompt);
        const storyEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle('📖 Uma História')
          .setDescription(response)
          .setFooter({ text: '🖤 Tales from the Void' });

        await message.reply({ embeds: [storyEmbed] });
      } catch (error) {
        console.error('Story Error:', error);
        await message.reply('Desculpa, hoje não consigo contar histórias... 🖤');
      }
    }
  },

  miku: {
    name: '!miku',
    description: 'Mostra uma imagem aleatória da Miku',
    execute: async (message) => {
      const mikuImages = [
        'https://i.pinimg.com/originals/94/d4/0b/94d40b947385906c55685906c5568590.jpg',
        'https://i.pinimg.com/736x/8e/3c/6e/8e3c6e94e5e9e9e9e9e9e9e9e9e9e9e9.jpg',
        'https://i.pinimg.com/736x/cf/6b/9d/cf6b9d8e3c6e94e5e9e9e9e9e9e9e9e9.jpg'
      ];
      const randomImage = mikuImages[Math.floor(Math.random() * mikuImages.length)];
      const mikuEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('🎤 Hatsune Miku!')
        .setImage(randomImage)
        .setFooter({ text: 'Fufu~ Eu sou a Diva! 💙' });
      await message.reply({ embeds: [mikuEmbed] });
    }
  },

  warn: {
    name: '!warn',
    description: 'Avisa um usuário',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.reply('❌ Você não tem permissão para avisar membros!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) {
        await message.reply('❌ Mencione um usuário para avisar!');
        return;
      }
      const reason = args.slice(1).join(' ') || 'Sem motivo especificado';
      const count = addWarn(user.id, message.author.id, reason);
      
      const warnEmbed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('⚠️ Usuário Avisado')
        .setDescription(`${user.tag} recebeu um aviso.\nEste é o aviso número **${count}**.`)
        .addFields({ name: 'Motivo', value: reason })
        .setFooter({ text: 'Staff em ação' });
      
      await message.reply({ embeds: [warnEmbed] });
      try {
        await user.send(`⚠️ Você recebeu um aviso no servidor **${message.guild.name}**!\n**Motivo:** ${reason}\nTotal de avisos: **${count}**`);
      } catch (e) {}
    }
  },

  warns: {
    name: '!warns',
    aliases: ['!avisos'],
    description: 'Lista os avisos de um usuário',
    execute: async (message) => {
      const user = message.mentions.users.first() || message.author;
      const userWarns = getWarns(user.id);
      
      if (userWarns.length === 0) {
        await message.reply(`✅ **${user.username}** não possui nenhum aviso.`);
        return;
      }

      const warnsEmbed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle(`⚠️ Avisos de ${user.username}`)
        .setDescription(userWarns.map((w, i) => `**${i + 1}.** Por <@${w.staffId}>: ${w.reason} *(<t:${Math.floor(new Date(w.timestamp).getTime() / 1000)}:R>)*`).join('\n'))
        .setFooter({ text: `Total: ${userWarns.length} aviso(s)` });

      await message.reply({ embeds: [warnsEmbed] });
    }
  },

  unwarn: {
    name: '!unwarn',
    description: 'Remove o último aviso de um usuário',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.reply('❌ Sem permissão!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione um usuário!');
      
      const userWarns = getWarns(user.id);
      if (userWarns.length === 0) return message.reply('❌ Este usuário não tem avisos.');

      removeWarn(user.id, userWarns.length - 1);
      await message.reply(`✅ Último aviso de **${user.username}** foi removido.`);
    }
  },

  clearwarns: {
    name: '!clearwarns',
    description: 'Limpa todos os avisos de um usuário',
    execute: async (message) => {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply('❌ Apenas administradores podem limpar todos os avisos!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione um usuário!');
      
      clearWarns(user.id);
      await message.reply(`✅ Todos os avisos de **${user.username}** foram limpos.`);
    }
  },

  kick: {
    name: '!kick',
    description: 'Expulsa um usuário',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        await message.reply('❌ Sem permissão!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione alguém!');
      const member = await message.guild.members.fetch(user.id);
      const reason = args.slice(1).join(' ') || 'Sem motivo';
      await member.kick(reason);
      await message.reply(`✅ ${user.tag} expulso por: ${reason}`);
    }
  },

  clear_msgs: {
    name: '!limpar_chat',
    aliases: ['!purge', '!clean'],
    description: 'Limpa mensagens do chat',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await message.reply('❌ Você não tem permissão para gerenciar mensagens!');
        return;
      }
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        await message.reply('❌ Especifique uma quantidade entre 1 e 100!');
        return;
      }
      await message.channel.bulkDelete(amount, true);
      const sent = await message.channel.send(`✅ Limpei **${amount}** mensagens!`);
      setTimeout(() => sent.delete(), 3000);
    }
  },

  slowmode: {
    name: '!slowmode',
    description: 'Define o modo lento do canal',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.reply('❌ Sem permissão!');
        return;
      }
      const time = parseInt(args[0]) || 0;
      await message.channel.setRateLimitPerUser(time);
      await message.reply(`✅ Modo lento definido para **${time}s**!`);
    }
  },

  lock: {
    name: '!lock',
    description: 'Tranca o canal',
    execute: async (message) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.reply('❌ Sem permissão!');
        return;
      }
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      await message.reply('🔒 Canal trancado!');
    }
  },

  unlock: {
    name: '!unlock',
    description: 'Destranca o canal',
    execute: async (message) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.reply('❌ Sem permissão!');
        return;
      }
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
      await message.reply('🔓 Canal destrancado!');
    }
  },

  ban: {
    name: '!ban',
    description: 'Bane um usuário do servidor',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        await message.reply('❌ Você não tem permissão para banir membros!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione um usuário para banir!');
      const member = await message.guild.members.fetch(user.id);
      if (!member.bannable) return message.reply('❌ Eu não posso banir este usuário!');
      
      const reason = args.slice(1).join(' ') || 'Sem motivo especificado';
      await member.ban({ reason });
      
      const banEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔨 Usuário Banido')
        .setDescription(`**${user.tag}** foi banido com sucesso.`)
        .addFields({ name: 'Motivo', value: reason })
        .setFooter({ text: 'Justiça divina aplicada' })
        .setTimestamp();
        
      await message.reply({ embeds: [banEmbed] });
    }
  },

  mute: {
    name: '!mute',
    aliases: ['!timeout'],
    description: 'Silencia um usuário (Timeout)',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.reply('❌ Você não tem permissão para silenciar membros!');
        return;
      }
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione um usuário para silenciar!');
      const member = await message.guild.members.fetch(user.id);
      
      const duration = parseInt(args[1]) || 60; // default 60 minutes
      const reason = args.slice(2).join(' ') || 'Sem motivo especificado';
      
      try {
        await member.timeout(duration * 60 * 1000, reason);
        const muteEmbed = new EmbedBuilder()
          .setColor('#808080')
          .setTitle('🔇 Usuário Silenciado')
          .setDescription(`**${user.tag}** foi silenciado por ${duration} minutos.`)
          .addFields({ name: 'Motivo', value: reason })
          .setTimestamp();
        await message.reply({ embeds: [muteEmbed] });
      } catch (error) {
        console.error(error);
        await message.reply('❌ Não foi possível silenciar o usuário.');
      }
    }
  },

  moeda: {
    name: '!moeda',
    aliases: ['!caraoucoroa'],
    description: 'Joga uma moeda (Cara ou Coroa)',
    execute: async (message) => {
      const result = Math.random() < 0.5 ? 'Cara' : 'Coroa';
      await message.reply(`🪙 A moeda caiu em... **${result}**!`);
    }
  },

  avatar: {
    name: '!avatar',
    description: 'Mostra o avatar de um usuário',
    execute: async (message) => {
      const user = message.mentions.users.first() || message.author;
      const avatarEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle(`🖼️ Avatar de ${user.username}`)
        .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
        .setFooter({ text: `Pedido por ${message.author.username}` });
      await message.reply({ embeds: [avatarEmbed] });
    }
  },

  userinfo: {
    name: '!userinfo',
    description: 'Mostra informações sobre um usuário',
    execute: async (message) => {
      const user = message.mentions.users.first() || message.author;
      const member = await message.guild.members.fetch(user.id);
      const infoEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle(`👤 Informações de ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Tag', value: user.tag, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Entrou no Servidor', value: member.joinedAt.toLocaleDateString('pt-BR'), inline: true },
          { name: 'Conta Criada', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
          { name: 'Cargos', value: member.roles.cache.map(r => r.name).slice(0, 5).join(', ') || 'Nenhum' }
        );
      await message.reply({ embeds: [infoEmbed] });
    }
  },

  serverinfo: {
    name: '!serverinfo',
    description: 'Mostra informações sobre o servidor',
    execute: async (message) => {
      const { guild } = message;
      const serverEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle(`🏰 ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: 'Dono', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Membros', value: `${guild.memberCount}`, inline: true },
          { name: 'Cargos', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Canais', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true }
        );
      await message.reply({ embeds: [serverEmbed] });
    }
  },

  '8ball': {
    name: '!8ball',
    description: 'Faça uma pergunta para a bola 8 mágica',
    execute: async (message, args) => {
      const question = args.join(' ');
      if (!question) return message.reply('❌ Você precisa fazer uma pergunta!');
      const responses = ['Sim.', 'Não.', 'Talvez.', 'Com certeza!', 'Minhas fontes dizem que não.', 'Não conte com isso.', 'Pergunte novamente mais tarde.', 'Sinais apontam que sim.', 'Não posso prever agora.', 'Definitivamente sim.', 'Minha resposta é não.'];
      const result = responses[Math.floor(Math.random() * responses.length)];
      const ballEmbed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle('🔮 Bola 8 Mágica')
        .addFields({ name: 'Pergunta', value: question }, { name: 'Resposta', value: result });
      await message.reply({ embeds: [ballEmbed] });
    }
  },

  gayrate: {
    name: '!gayrate',
    description: 'Calcula o quão gay você é',
    execute: async (message) => {
      const user = message.mentions.users.first() || message.author;
      const rate = Math.floor(Math.random() * 101);
      await message.reply(`🌈 **${user.username}** é **${rate}%** gay!`);
    }
  },

  lovecalc: {
    name: '!lovecalc',
    description: 'Calcula o amor entre dois usuários',
    execute: async (message) => {
      const user1 = message.author;
      const user2 = message.mentions.users.first();
      if (!user2) return message.reply('❌ Mencione alguém para calcular o amor!');
      const rate = Math.floor(Math.random() * 101);
      let comment = '💔 Que pena...';
      if (rate > 50) comment = '💖 Tem potencial!';
      if (rate > 80) comment = '❤️ Alma gêmeas!';
      await message.reply(`💖 **${user1.username}** + **${user2.username}** = **${rate}%**\n${comment}`);
    }
  },

  ship: {
    name: '!ship',
    description: 'Shipa dois usuários aleatórios do servidor',
    execute: async (message) => {
      const members = await message.guild.members.fetch();
      const user1 = members.random().user;
      const user2 = members.random().user;
      const rate = Math.floor(Math.random() * 101);
      const shipName = user1.username.substring(0, 4) + user2.username.substring(user2.username.length - 4);
      await message.reply(`🚢 Ship da vez: **${user1.username}** + **${user2.username}** = **${shipName}**\nCompatibilidade: **${rate}%**!`);
    }
  },

  ppt: {
    name: '!ppt',
    description: 'Joga Pedra, Papel ou Tesoura com o bot',
    execute: async (message, args) => {
      const choices = ['pedra', 'papel', 'tesoura'];
      const userChoice = args[0]?.toLowerCase();
      if (!choices.includes(userChoice)) return message.reply('❌ Escolha: `pedra`, `papel` ou `tesoura`!');
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      let result = '';
      if (userChoice === botChoice) result = 'Empate! 🤝';
      else if ((userChoice === 'pedra' && botChoice === 'tesoura') || (userChoice === 'papel' && botChoice === 'pedra') || (userChoice === 'tesoura' && botChoice === 'papel')) result = 'Você ganhou! 🎉';
      else result = 'Eu ganhei! Hehe~ 💙';
      await message.reply(`Você escolheu **${userChoice}** e eu escolhi **${botChoice}**.\n**${result}**`);
    }
  },

  pat: {
    name: '!pat',
    description: 'Faz carinho em alguém',
    execute: async (message) => {
      const target = message.mentions.users.first();
      if (!target) return message.reply('❌ Mencione alguém para fazer carinho!');
      const patEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setDescription(`**${message.author.username}** fez carinho em **${target.username}**! 💙`)
        .setImage('https://media.giphy.com/media/5tmRh1obzf3fW/giphy.gif');
      await message.reply({ embeds: [patEmbed] });
    }
  },

  slap: {
    name: '!slap',
    description: 'Dá um tapa em alguém',
    execute: async (message) => {
      const target = message.mentions.users.first();
      if (!target) return message.reply('❌ Mencione alguém para dar um tapa!');
      const slapEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription(`**${message.author.username}** deu um tapa em **${target.username}**! 💢`)
        .setImage('https://media.giphy.com/media/Zau0yrl17uzdEXdzBb/giphy.gif');
      await message.reply({ embeds: [slapEmbed] });
    }
  },

  tempo: {
    name: '!tempo',
    description: 'Verifica o clima de uma cidade',
    execute: async (message, args) => {
      const city = args.join(' ');
      if (!city) return message.reply('❌ Digite o nome de uma cidade!');
      const temp = Math.floor(Math.random() * 15) + 15;
      await message.reply(`🌤️ O clima em **${city}** agora é de **${temp}°C** com céu limpo! 💙`);
    }
  },

  calculadora: {
    name: '!calculadora',
    aliases: ['!calc'],
    description: 'Uma calculadora simples',
    execute: async (message, args) => {
      try {
        const expression = args.join(' ');
        if (!expression) return message.reply('❌ Digite uma conta! Ex: `!calc 2 + 2`');
        const result = eval(expression.replace(/[^-()\d/*+.]/g, ''));
        await message.reply(`🧮 Resultado: **${result}**`);
      } catch (e) {
        await message.reply('❌ Conta inválida!');
      }
    }
  },

  kill: {
    name: '!kill',
    description: 'Mata alguém (de mentirinha!)',
    execute: async (message) => {
      const user = message.mentions.users.first();
      if (!user) return message.reply('❌ Mencione quem você quer eliminar!');
      const ways = [`empurrou **${user.username}** de um penhasco! 🏔️`, `atropelou **${user.username}** com um caminhão de sorvete! 🍦`, `fez **${user.username}** ouvir funk no volume máximo até explodir! 🔊`, `esqueceu **${user.username}** no vácuo por 10 anos! 💨` ];
      const result = ways[Math.floor(Math.random() * ways.length)];
      await message.reply(`💀 **${message.author.username}** ${result}`);
    }
  },

  transferirsonhos: {
    name: '!transferirsonhos',
    description: 'Transfere Akita Neru para Sonhos na Loritta',
    execute: async (message, args) => {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return message.reply('❌ Valor inválido!');
      const balance = getBalance(message.author.id);
      if (balance < amount) return message.reply('❌ Saldo insuficiente!');
      const success = await requestSonhosTransfer(message.guild.id, message.channel.id, message.author.id, amount, 'Transferência Diva Bot', LORITTA_API_KEY);
      if (success) {
        removeBalance(message.author.id, amount);
        await message.reply('✅ Transferência realizada!');
      } else {
        await message.reply('❌ Erro na transferência!');
      }
    }
  },

  versonhos: {
    name: '!versonhos',
    description: 'Vê seus sonhos na Loritta',
    execute: async (message) => {
      const sonhos = await getUserSonhos(message.author.id, LORITTA_API_KEY);
      await message.reply(sonhos !== null ? `✨ Você tem **${sonhos}** sonhos!` : '❌ Erro ao consultar sonhos!');
    }
  },

  balance: {
    name: '!balance',
    aliases: ['!bal', '!saldo'],
    description: 'Vê seu saldo de Akita Neru',
    execute: async (message) => {
      const bal = getBalance(message.author.id);
      await message.reply(`💰 Seu saldo: **${bal} Akita Neru**`);
    }
  },

  daily: {
    name: '!daily',
    description: 'Resgate sua recompensa diária',
    execute: async (message) => {
      const result = dailyReward(message.author.id);
      if (result.success) await message.reply(`✨ Você resgatou **${result.amount} Akita Neru**!`);
      else await message.reply(`❌ Volte em **${result.timeLeft}**!`);
    }
  },

  work: {
    name: '!work',
    description: 'Trabalhe para ganhar Akita Neru',
    execute: async (message) => {
      const result = work(message.author.id);
      if (result.success) await message.reply(`🛠️ Você trabalhou e ganhou **${result.amount} Akita Neru**!`);
      else await message.reply(`❌ Descanse um pouco! Volte em **${result.timeLeft}**.`);
    }
  }
};

export const handleCommand = async (message, client) => {
  const content = message.content.toLowerCase();
  
  // Encontrar o comando
  let command = null;
  let args = [];

  if (content.startsWith('!')) {
    const fullArgs = message.content.slice(1).split(/ +/);
    const cmdName = fullArgs.shift().toLowerCase();
    args = fullArgs;
    
    command = Object.values(commands).find(c => {
      const name = c.name.startsWith('!') ? c.name.slice(1).toLowerCase() : c.name.toLowerCase();
      const hasAlias = c.aliases && c.aliases.some(a => (a.startsWith('!') ? a.slice(1).toLowerCase() : a.toLowerCase()) === cmdName);
      return name === cmdName || hasAlias;
    });
  }

  if (!command) return false;

  try {
    await command.execute(message, args, client);
    return true;
  } catch (error) {
    console.error(`Erro ao executar comando ${command.name}:`, error);
    return false;
  }
};

export const shouldRespondToMention = (message, client) => {
  return message.mentions.has(client.user);
};
