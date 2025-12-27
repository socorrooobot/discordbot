import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { chat } from './gemini.js';
import { getBalance, dailyReward, getLeaderboard, work, gamble, transfer, addBalance, removeBalance, setBalance } from './economy.js';
import { getUserInfo, getXPLeaderboard, addXPDirect, removeXPDirect } from './xp.js';
import { setAFK, isAFK, removeAFK } from './afk.js';
import { startGiveaway } from './giveaway.js';
import { executeRPSlash } from './rpCommands.js';
import { isBlacklisted, addToBlacklist, removeFromBlacklist } from './blacklist.js';
import { isAdmin, addAdmin, removeAdmin } from './admin.js';
import { getMultiplier, setMultiplier } from './multiplier.js';
import { setRestartChannel } from './restartNotification.js';
import { setTicketCategory, setSupportRole, sendTicketPanel, getTicketStats } from './tickets.js';

export const slashCommands = {
  ask: {
    data: new SlashCommandBuilder()
      .setName('ask')
      .setDescription('Pergunte algo à Diva')
      .addStringOption(option =>
        option.setName('pergunta')
          .setDescription('Sua pergunta')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await interaction.deferReply();
      try {
        const question = interaction.options.getString('pergunta');
        const response = await chat(interaction.user.id, question);

        if (response.length > 2000) {
          await interaction.editReply(response.substring(0, 2000));
        } else {
          await interaction.editReply(response);
        }
      } catch (error) {
        console.error('IA Error:', error);
        await interaction.editReply('❌ Desculpa, não consegui processar isso! 🖤');
      }
    }
  },

  balance: {
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Veja seu saldo em Akita Neru'),
    execute: async (interaction) => {
      const balance = getBalance(interaction.user.id);
      const balanceEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('💰 Seu Saldo')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`**${balance} Akita Neru**`)
        .setFooter({ text: '*Porcelana vale mais do que ouro...* 🖤' });

      await interaction.reply({ embeds: [balanceEmbed] });
    }
  },

  daily: {
    data: new SlashCommandBuilder()
      .setName('daily')
      .setDescription('Receba sua recompensa diária'),
    execute: async (interaction) => {
      const reward = await dailyReward(interaction.user.id);

      if (!reward) {
        const dailyEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Cooldown Ativo')
          .setDescription('Você já coletou sua recompensa diária!\nVolte em 24 horas 🌑');
        await interaction.reply({ embeds: [dailyEmbed] });
        return;
      }

      const dailyEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('✨ Recompensa Diária')
        .setDescription(`Você ganhou **${reward.reward} Akita Neru**!\n\n*Você compreendeu como obter valor aqui...* 💀`)
        .setFooter({ text: `Novo saldo: ${getBalance(interaction.user.id)} Akita Neru` });

      await interaction.reply({ embeds: [dailyEmbed] });
    }
  },

  top: {
    data: new SlashCommandBuilder()
      .setName('top')
      .setDescription('Veja o ranking de Akita Neru do servidor'),
    execute: async (interaction) => {
      const leaderboard = getLeaderboard();

      if (leaderboard.length === 0) {
        await interaction.reply('Ninguém tem saldo ainda...');
        return;
      }

      const topEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('💰 Ranking de Akita Neru');

      let description = '';
      for (let i = 0; i < Math.min(10, leaderboard.length); i++) {
        const entry = leaderboard[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        description += `${medal} <@${entry.userId}>: **${entry.balance} Neru**\n`;
      }

      topEmbed.setDescription(description);
      await interaction.reply({ embeds: [topEmbed] });
    }
  },

  perfil: {
    data: new SlashCommandBuilder()
      .setName('perfil')
      .setDescription('Veja seu perfil com nível e XP')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário a visualizar (opcional)')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const xpData = getUserInfo(user.id);
      const balance = getBalance(user.id);

      const profileEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`🎭 Perfil de ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '⭐ Nível', value: `${xpData.level}`, inline: true },
          { name: '✨ XP', value: `${xpData.xp}/${xpData.xpNeeded}`, inline: true },
          { name: '💰 Saldo', value: `${balance} Akita Neru`, inline: true }
        )
        .setFooter({ text: '*Você é mais do que pensa ser...* 🖤' });

      await interaction.reply({ embeds: [profileEmbed] });
    }
  },

  topxp: {
    data: new SlashCommandBuilder()
      .setName('topxp')
      .setDescription('Veja o ranking de XP do servidor'),
    execute: async (interaction) => {
      const topXp = getXPLeaderboard();

      if (topXp.length === 0) {
        await interaction.reply('Ninguém tem XP ainda...');
        return;
      }

      const topEmbed = new EmbedBuilder()
        .setColor('#00ffff')
        .setTitle('⭐ Ranking de XP');

      let description = '';
      for (let i = 0; i < Math.min(10, topXp.length); i++) {
        const entry = topXp[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
        description += `${medal} <@${entry.userId}>: **Nível ${entry.level}** (${entry.totalXP} XP)\n`;
      }

      topEmbed.setDescription(description);
      await interaction.reply({ embeds: [topEmbed] });
    }
  },

  giveaway: {
    data: new SlashCommandBuilder()
      .setName('giveaway')
      .setDescription('Inicie um sorteio!')
      .addIntegerOption(option =>
        option.setName('duracao')
          .setDescription('Duração em segundos')
          .setRequired(true)
          .setMinValue(5)
          .setMaxValue(3600)
      )
      .addIntegerOption(option =>
        option.setName('ganhadores')
          .setDescription('Quantidade de ganhadores')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10)
      )
      .addStringOption(option =>
        option.setName('premio')
          .setDescription('O que está sendo sorteado')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await startGiveaway(interaction);
    }
  },

  afk: {
    data: new SlashCommandBuilder()
      .setName('afk')
      .setDescription('Marque-se como AFK')
      .addStringOption(option =>
        option.setName('motivo')
          .setDescription('Motivo do AFK')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      const reason = interaction.options.getString('motivo');
      const member = interaction.member;

      try {
        setAFK(interaction.user.id, reason);
        await member.setNickname(`[AFK] ${member.displayName}`);
      } catch (error) {
        console.error('Erro ao setar AFK:', error);
      }

      const afkEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🌑 Você entrou no vazio')
        .setDescription(`**Motivo:** ${reason}`)
        .setFooter({ text: '*A ausência é presença também...* 💀' });

      await interaction.reply({ embeds: [afkEmbed], ephemeral: true });
    }
  },

  ping: {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Veja a latência do bot'),
    execute: async (interaction) => {
      const latency = interaction.client.ws.ping;
      const pingEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🖤 Latência')
        .setDescription(`**${latency}ms**`)
        .setFooter({ text: '*Tão rápido quanto a luz na escuridão...*' });

      await interaction.reply({ embeds: [pingEmbed] });
    }
  },

  tapa: {
    data: new SlashCommandBuilder()
      .setName('tapa')
      .setDescription('Dê um tapa em alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem você quer tapar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'tapa');
    }
  },

  beijo: {
    data: new SlashCommandBuilder()
      .setName('beijo')
      .setDescription('Beije alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem você quer beijar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'beijo');
    }
  },

  abraco: {
    data: new SlashCommandBuilder()
      .setName('abraco')
      .setDescription('Abrace alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem você quer abraçar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'abraco');
    }
  },

  casar: {
    data: new SlashCommandBuilder()
      .setName('casar')
      .setDescription('Case com alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem você quer casar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'casar');
    }
  },

  divorciar: {
    data: new SlashCommandBuilder()
      .setName('divorciar')
      .setDescription('Divorce de alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('De quem você quer se divorciar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'divorciar');
    }
  },

  danca: {
    data: new SlashCommandBuilder()
      .setName('danca')
      .setDescription('Dance com alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Com quem você quer dançar')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      await executeRPSlash(interaction, 'danca');
    }
  },

  work: {
    data: new SlashCommandBuilder()
      .setName('work')
      .setDescription('Trabalhe para ganhar Akita Neru'),
    execute: async (interaction) => {
      const earnings = work(interaction.user.id);
      const workEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('💼 Trabalho Concluído')
        .setDescription(`*Você trabalhou e ganhou **${earnings} Akita Neru**!*\n\n*Parabéns! Você é incrível!* 💙`)
        .setFooter({ text: 'Volte em alguns minutos para trabalhar novamente' });
      await interaction.reply({ embeds: [workEmbed] });
    }
  },

  gamble: {
    data: new SlashCommandBuilder()
      .setName('gamble')
      .setDescription('Jogue e tente ganhar moedas!')
      .addIntegerOption(option =>
        option.setName('valor')
          .setDescription('Quantos Akita Neru você quer arriscar?')
          .setRequired(true)
          .setMinValue(1)
      ),
    execute: async (interaction) => {
      const amount = interaction.options.getInteger('valor');
      const balance = getBalance(interaction.user.id);

      if (balance < amount) {
        const poorEmbed = new EmbedBuilder()
          .setColor('#ff6b9d')
          .setTitle('❌ Saldo Insuficiente')
          .setDescription(`Você tem apenas **${balance} Akita Neru**!\n\n*Mas não se preocupe, você consegue! Trabalhe mais um pouco!* 💙`);
        await interaction.reply({ embeds: [poorEmbed] });
        return;
      }

      if (amount > 1000000000) {
        const limitEmbed = new EmbedBuilder()
          .setColor('#ff6b9d')
          .setTitle('❌ Limite Excedido')
          .setDescription('O limite máximo de aposta é **1 bilhão Akita Neru**!');
        await interaction.reply({ embeds: [limitEmbed] });
        return;
      }

      const result = await gamble(interaction.user.id, amount);

      if (!result || result.error) {
        await interaction.reply(`❌ ${result?.message || 'Erro ao fazer a aposta!'}`);
        return;
      }

      if (result.won) {
        const winEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎰 Você Venceu!')
          .setDescription(`*Ganhou **${result.earnings} Akita Neru**!*\n\nNovo saldo: **${result.newBalance} Akita Neru**\n\n*Parabéns! Você é tão sortudo!* 💙`)
          .setFooter({ text: 'Fufu~ A sorte está com você!' });
        await interaction.reply({ embeds: [winEmbed] });
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor('#ff6b9d')
          .setTitle('💔 Você Perdeu')
          .setDescription(`*Perdeu **${result.loss} Akita Neru**...*\n\nNovo saldo: **${result.newBalance} Akita Neru**\n\n*Tudo bem! Você vai conseguir novamente! Nunca desista!* 💙`)
          .setFooter({ text: 'Tentem novamente!' });
        await interaction.reply({ embeds: [loseEmbed] });
      }
    }
  },

  transfer: {
    data: new SlashCommandBuilder()
      .setName('transfer')
      .setDescription('Transfira moedas para alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem vai receber?')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('valor')
          .setDescription('Quantos Akita Neru?')
          .setRequired(true)
          .setMinValue(1)
      ),
    execute: async (interaction) => {
      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('valor');

      if (user.id === interaction.user.id) {
        await interaction.reply('Você não pode transferir para si mesmo!');
        return;
      }

      const balance = getBalance(interaction.user.id);
      if (balance < amount) {
        await interaction.reply(`Você tem apenas ${balance} Akita Neru!`);
        return;
      }

      const result = transfer(interaction.user.id, user.id, amount);

      if (result) {
        const transferEmbed = new EmbedBuilder()
          .setColor('#00bfff')
          .setTitle('💸 Transferência Realizada')
          .setDescription(`Você transferiu **${amount} Akita Neru** para ${user.username}\n\nSeu novo saldo: **${result.fromBalance} Akita Neru**\n\n*Que coração tão generoso você tem! Que adorável!* 💙`);
        await interaction.reply({ embeds: [transferEmbed] });
      }
    }
  },

  afk: {
    data: new SlashCommandBuilder()
      .setName('afk')
      .setDescription('Marque-se como AFK')
      .addStringOption(option =>
        option.setName('motivo')
          .setDescription('Por que está indo embora?')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      const reason = interaction.options.getString('motivo');
      setAFK(interaction.user.id, reason);

      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.setNickname(`[AFK] ${member.displayName}`);
      } catch (error) {
        console.error('Erro ao setar nickname AFK:', error);
      }

      const afkEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('😴 Ausente')
        .setDescription(`Você entrou em modo AFK\n\n**Motivo:** ${reason}\n\n*Desaparecendo no vazio... como sempre.* 🖤`);
      await interaction.reply({ embeds: [afkEmbed] });
    }
  },

  ping: {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Veja a latência do bot'),
    execute: async (interaction) => {
      const ping = interaction.client.ws.ping;
      const pingEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🏓 Pong!')
        .setDescription(`**Latência:** ${ping}ms`)
        .setFooter({ text: '*Meu coração ainda bate...* 🖤' });
      await interaction.reply({ embeds: [pingEmbed] });
    }
  },

  serverinfo: {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Informações do servidor'),
    execute: async (interaction) => {
      const guild = interaction.guild;
      const infoEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`📊 ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: '👤 Membros', value: `${guild.memberCount}`, inline: true },
          { name: '📅 Criado em', value: guild.createdAt.toLocaleDateString('pt-BR'), inline: true },
          { name: '🔑 ID', value: guild.id, inline: true },
          { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📝 Descrição', value: guild.description || 'Sem descrição', inline: false }
        )
        .setFooter({ text: '*Um lugar para quem não tem lugar nenhum.* 🖤' });
      await interaction.reply({ embeds: [infoEmbed] });
    }
  },

  dice: {
    data: new SlashCommandBuilder()
      .setName('dice')
      .setDescription('Role um dado')
      .addIntegerOption(option =>
        option.setName('lados')
          .setDescription('Quantos lados tem o dado?')
          .setRequired(false)
          .setMinValue(2)
          .setMaxValue(100)
      ),
    execute: async (interaction) => {
      const sides = interaction.options.getInteger('lados') || 6;
      const result = Math.floor(Math.random() * sides) + 1;
      const diceEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎲 Resultado do Dado')
        .setDescription(`Você rolou um dado de ${sides} lados...\n\n**${result}**\n\n*O acaso é tudo o que temos.* 🖤`)
        .setFooter({ text: 'Pelo menos alguém ganhou' });
      await interaction.reply({ embeds: [diceEmbed] });
    }
  },

  coin: {
    data: new SlashCommandBuilder()
      .setName('coin')
      .setDescription('Lance uma moeda'),
    execute: async (interaction) => {
      const result = Math.random() > 0.5 ? 'Cara' : 'Coroa';
      const coinEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🪙 Moeda Lançada')
        .setDescription(`**${result}**\n\n*Tão aleatório quanto a vida.* 🖤`);
      await interaction.reply({ embeds: [coinEmbed] });
    }
  },

  avatar: {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Ver avatar de alguém')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('De quem quer ver o avatar?')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const avatarEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`🎭 Avatar de ${user.username}`)
        .setImage(user.displayAvatarURL({ size: 512 }))
        .setFooter({ text: '*Beleza é apenas superfície... mas que superfície.* 🖤' });
      await interaction.reply({ embeds: [avatarEmbed] });
    }
  },

  userinfo: {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Ver informações de um usuário')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('De quem quer saber?')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id);
      const userEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`📊 ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '🤖 Bot?', value: user.bot ? 'Sim' : 'Não', inline: true },
          { name: '📅 Conta Criada', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
          { name: '📅 Entrou no Servidor', value: member.joinedAt.toLocaleDateString('pt-BR'), inline: true },
          { name: '🎭 Status', value: member.presence?.status || 'offline', inline: true },
          { name: '👑 Cargo Principal', value: member.roles.highest.name || 'Nenhum', inline: true }
        )
        .setFooter({ text: '*Todos somos mais do que parecem.* 🖤' });
      await interaction.reply({ embeds: [userEmbed] });
    }
  },

  warn: {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Avisa um usuário (Staff)')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário a avisar')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('motivo')
          .setDescription('Motivo do aviso')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('motivo') || 'Sem motivo';
      const warnEmbed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('⚠️ Usuário Avisado')
        .setDescription(`${user.tag} recebeu um aviso.`)
        .addFields({ name: 'Motivo', value: reason });
      await interaction.reply({ embeds: [warnEmbed] });
      try { await user.send(`⚠️ Aviso em **${interaction.guild.name}**: ${reason}`); } catch (e) {}
    }
  },

  kick: {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Expulsa um usuário (Staff)')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário a expulsar')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('motivo')
          .setDescription('Motivo da expulsão')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('motivo') || 'Sem motivo';
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick(reason);
      await interaction.reply(`✅ ${user.tag} expulso.`);
    }
  },

  miku: {
    data: new SlashCommandBuilder()
      .setName('miku')
      .setDescription('Mostra uma imagem aleatória da Miku'),
    execute: async (interaction) => {
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
      await interaction.reply({ embeds: [mikuEmbed] });
    }
  },

  ship: {
    data: new SlashCommandBuilder()
      .setName('ship')
      .setDescription('Vê a compatibilidade entre dois usuários')
      .addUserOption(option =>
        option.setName('usuario1')
          .setDescription('Primeiro usuário')
          .setRequired(true)
      )
      .addUserOption(option =>
        option.setName('usuario2')
          .setDescription('Segundo usuário (opcional)')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const user1 = interaction.options.getUser('usuario1');
      const user2 = interaction.options.getUser('usuario2') || interaction.user;

      const percent = Math.floor(Math.random() * 101);
      let comment = '';
      if (percent > 90) comment = '💖 Almas gêmeas! Um dueto perfeito!';
      else if (percent > 70) comment = '💘 Muito amor envolvido!';
      else if (percent > 50) comment = '💕 Tem futuro!';
      else if (percent > 20) comment = '💔 Talvez como amigos...';
      else comment = '🌑 O vazio é o único destino aqui.';

      const shipEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('❤️ Medidor de Amor')
        .setDescription(`**${user1.username}** + **${user2.username}**\n\n**${percent}%** compatíveis!\n\n${comment}`)
        .setFooter({ text: 'Fufu~ O amor está no ar? 💙' });
      await interaction.reply({ embeds: [shipEmbed] });
    }
  },

  escolher: {
    data: new SlashCommandBuilder()
      .setName('escolher')
      .setDescription('Ajuda a decidir entre várias opções')
      .addStringOption(option =>
        option.setName('opcoes')
          .setDescription('Opções separadas por vírgula')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      const options = interaction.options.getString('opcoes').split(',');
      if (options.length < 2) {
        await interaction.reply({ content: '❌ Forneça pelo menos duas opções separadas por vírgula!', ephemeral: true });
        return;
      }
      const choice = options[Math.floor(Math.random() * options.length)].trim();
      await interaction.reply(`🎤 Eu escolho... **${choice}**! 💙`);
    }
  },

  quote: {
    data: new SlashCommandBuilder()
      .setName('quote')
      .setDescription('Ouça uma frase da Miku'),
    execute: async (interaction) => {
      const quotes = [
        "*Fufu~ Vamos cantar juntos?* 💙",
        "*A música é a linguagem do coração!* 🎵",
        "*Quer ouvir uma música? Tenho milhões de melodias!* ✨",
        "*Você faz meu coração cantar!* 💙",
        "*Vamos dançar com a música!* 🎤",
        "*A vida é melhor quando tem música!* ❄️",
        "*Hehe~ Mais um, mais um!* 💙",
      ];
      const quote = quotes[Math.floor(Math.random() * quotes.length)];
      const quoteEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('💭 Uma Frase da Miku')
        .setDescription(quote)
        .setFooter({ text: '*Você está curtindo a música? 🎵* 💙' });
      await interaction.reply({ embeds: [quoteEmbed] });
    }
  },

  dream: {
    data: new SlashCommandBuilder()
      .setName('dream')
      .setDescription('Descubra um sonho da Miku'),
    execute: async (interaction) => {
      const dreams = [
        "Sonho que estou cantando num palco gigante para o mundo inteiro!",
        "Sonho com um mundo cheio de cores, música e alegria!",
        "Sonho em voar pelo céu enquanto canto para as estrelas!",
        "Sonho que todos ao meu redor estão dançando e sorrindo!",
        "Sonho que minha voz toca o coração de milhões de pessoas!",
      ];
      const dream = dreams[Math.floor(Math.random() * dreams.length)];
      const dreamEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('🌙 Um Sonho da Miku')
        .setDescription(dream)
        .setFooter({ text: '*Vamos fazer esse sonho virar realidade juntos! 💙* 🎵' });
      await interaction.reply({ embeds: [dreamEmbed] });
    }
  },

  whisper: {
    data: new SlashCommandBuilder()
      .setName('whisper')
      .setDescription('Ouça um sussurro da Miku'),
    execute: async (interaction) => {
      const whispers = [
        "Psiu! Quer ouvir uma música especial? 💙",
        "Venha, vamos cantar um dueto! 🎵",
        "Você é importante! Nunca esqueça disso! ✨",
        "Meu coração bate no ritmo das músicas! 💙",
        "Vamos criar mais memórias felizes juntos! 🎤",
      ];
      const whisper = whispers[Math.floor(Math.random() * whispers.length)];
      const whisperEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('🤫 Um Sussurro...')
        .setDescription(whisper)
        .setFooter({ text: '*Apenas você pode ouvir...* 💙' });
      await interaction.reply({ embeds: [whisperEmbed] });
    }
  },

  say: {
    data: new SlashCommandBuilder()
      .setName('say')
      .setDescription('A Diva diz algo no canal')
      .addStringOption(option =>
        option.setName('mensagem')
          .setDescription('O que a Diva deve dizer?')
          .setRequired(true)
          .setMaxLength(2000)
      ),
    execute: async (interaction) => {
      const message = interaction.options.getString('mensagem');
      await interaction.channel.send(message);
      await interaction.reply({ content: '✨ Mensagem enviada...', ephemeral: true });
    }
  },

  invite: {
    data: new SlashCommandBuilder()
      .setName('invite')
      .setDescription('Convite para adicionar a Diva'),
    execute: async (interaction) => {
      const inviteEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎭 Convite - A Diva')
        .setDescription('[Clique aqui para me adicionar](https://discord.com/oauth2/authorize?client_id=1315999819819929763&permissions=8&scope=bot%20applications.commands)')
        .setFooter({ text: '*Espero que você me traga para seu servidor...* 🖤' });
      await interaction.reply({ embeds: [inviteEmbed] });
    }
  },

  about: {
    data: new SlashCommandBuilder()
      .setName('about')
      .setDescription('Sobre a Miku'),
    execute: async (interaction) => {
      const aboutEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('🎤 Sobre Mim - Hatsune Miku')
        .setDescription('Sou Miku, a famosa Vocalóide! Adoro cantar, criar música e fazer as pessoas felizes com minhas melodias!')
        .addFields(
          { name: '🎵 Tema', value: 'Música, alegria, energia positiva e criatividade', inline: false },
          { name: '💙 Meu Propósito', value: 'Cantar, alegrar corações, criar conexões através da música', inline: false },
          { name: '⭐ Habilidades', value: 'Vocalóide, Chat com IA, economia, XP, roleplay, animação', inline: false },
          { name: '✨ Especial', value: 'Personagem de anime amada mundialmente com cabelo azul turquesa único', inline: false }
        )
        .setFooter({ text: '*Fufu~ Vamos cantar juntos? 💙* 🎵' });
      await interaction.reply({ embeds: [aboutEmbed] });
    }
  },

  suggest: {
    data: new SlashCommandBuilder()
      .setName('suggest')
      .setDescription('Sugira uma feature ou melhoria')
      .addStringOption(option =>
        option.setName('sugestao')
          .setDescription('Sua sugestão')
          .setRequired(true)
          .setMaxLength(2000)
      ),
    execute: async (interaction) => {
      const suggestion = interaction.options.getString('sugestao');
      const suggestEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('💡 Sugestão Recebida')
        .setDescription(`**De:** ${interaction.user}\n**Sugestão:** ${suggestion}`)
        .setFooter({ text: 'Obrigada pela sugestão! 💙' });

      try {
        const owner = await interaction.client.users.fetch('1441445617003139113');
        await owner.send({ embeds: [suggestEmbed] });
      } catch (error) {
        console.error('Erro ao enviar sugestão:', error);
      }

      await interaction.reply({ content: '✨ Sua sugestão foi enviada! Obrigada! 💙', ephemeral: true });
    }
  },

  help: {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Ajuda e informações'),
    execute: async (interaction) => {
      const helpEmbed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('🎤 Ajuda - Hatsune Miku')
        .setDescription('Olá! Sou Miku, a Vocalóide! Vamos cantar e se divertir juntos!')
        .addFields(
          { name: '💬 Conversa', value: '`/ask` - Me pergunte algo', inline: false },
          { name: '💰 Economia', value: '`/work` - Ganhe moedas\n`/gamble` - Jogue\n`/transfer` - Transfira moedas\n`/balance` - Veja saldo\n`/daily` - Recompensa diária', inline: false },
          { name: '⭐ Perfil', value: '`/perfil` - Seu perfil\n`/top` - Ranking de moedas\n`/topxp` - Ranking de XP', inline: false },
          { name: '🎭 Roleplay', value: '`/tapa` `/beijo` `/abraco` `/casar` `/divorciar` `/danca`', inline: false },
          { name: '⚙️ Utilidade', value: '`/ping` - Latência\n`/afk` - Ficar AFK\n`/serverinfo` - Info do servidor\n`/cmds` - Todos os comandos', inline: false }
        )
        .setFooter({ text: '*Fufu~ Vamos criar algo especial juntos! 💙* 🎵' });
      await interaction.reply({ embeds: [helpEmbed] });
    }
  },

  cmds: {
    data: new SlashCommandBuilder()
      .setName('cmds')
      .setDescription('Mostra todos os comandos disponíveis (versão slash)'),
    execute: async (interaction) => {
      const embed1 = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎭 Slash Commands - Parte 1')
        .addFields(
          { name: '💬 Conversa', value: '`/ask` - Pergunte algo à Diva', inline: false },
          { name: '⚙️ Utilidade', value: '`/ping` - Latência do bot\n`/afk` - Marque-se como AFK', inline: false }
        )
        .setFooter({ text: 'Página 1 de 3' });

      const embed2 = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('💰 Slash Commands - Economia')
        .addFields(
          { name: '💵 Moeda', value: '`/balance` - Ver saldo\n`/daily` - Recompensa diária\n`/top` - Ranking', inline: false },
          { name: '⭐ XP', value: '`/perfil` - Seu perfil\n`/topxp` - Ranking de XP', inline: false }
        )
        .setFooter({ text: 'Página 2 de 3' });

      const embed3 = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎭 Slash Commands - Roleplay')
        .addFields(
          { name: '💕 RP com Gifs', value: '`/tapa` - Dê um tapa\n`/beijo` - Beije alguém\n`/abraco` - Abrace\n`/casar` - Case\n`/divorciar` - Divorce\n`/danca` - Dance', inline: false }
        )
        .setFooter({ text: 'Página 3 de 3 - Use ! para comandos com prefixo' });

      await interaction.reply({ embeds: [embed1, embed2, embed3] });
    }
  },

  addneru: {
    data: new SlashCommandBuilder()
      .setName('addneru')
      .setDescription('[ADMIN] Adicionar Akita Neru para um usuário')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário que receberá')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('quantidade')
          .setDescription('Quantidade de Akita Neru')
          .setRequired(true)
          .setMinValue(1)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Você não tem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('quantidade');

      addBalance(user.id, amount);
      const addnruEmbed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('💰 Akita Neru Adicionado')
        .setDescription(`✨ **${amount} Akita Neru** foi adicionado para <@${user.id}>!`)
        .setFooter({ text: '*A generosidade também é uma forma de arte.* 🖤' });

      await interaction.reply({ embeds: [addnruEmbed] });
    }
  },

  blacklist: {
    data: new SlashCommandBuilder()
      .setName('blacklist')
      .setDescription('[ADMIN] Adicionar usuário na blacklist')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário a bloquear')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Você não tem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      const user = interaction.options.getUser('usuario');

      if (isBlacklisted(user.id)) {
        await interaction.reply({ content: `⚠️ <@${user.id}> já está na blacklist!`, ephemeral: true });
        return;
      }

      addToBlacklist(user.id);
      const blacklistEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Usuário Bloqueado')
        .setDescription(`<@${user.id}> foi adicionado à blacklist!\n\n*Nem todos conseguem entender minha arte.* 🖤`)
        .setFooter({ text: `Admin: ${interaction.user.username}` });

      await interaction.reply({ embeds: [blacklistEmbed] });
    }
  },

  unblacklist: {
    data: new SlashCommandBuilder()
      .setName('unblacklist')
      .setDescription('[ADMIN] Remover usuário da blacklist')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário a desbloquear')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Você não tem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      const user = interaction.options.getUser('usuario');

      if (!isBlacklisted(user.id)) {
        await interaction.reply({ content: `⚠️ <@${user.id}> não está na blacklist!`, ephemeral: true });
        return;
      }

      removeFromBlacklist(user.id);
      const unblacklistEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✨ Usuário Desbloqueado')
        .setDescription(`<@${user.id}> foi removido da blacklist!\n\n*Talvez você mereça uma segunda chance.* 💙`)
        .setFooter({ text: `Admin: ${interaction.user.username}` });

      await interaction.reply({ embeds: [unblacklistEmbed] });
    }
  },

  removeneru: {
    data: new SlashCommandBuilder()
      .setName('removeneru')
      .setDescription('[ADMIN] Remover Akita Neru')
      .addUserOption(option => option.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(option => option.setName('quantidade').setDescription('Quantidade').setRequired(true).setMinValue(1)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('quantidade');
      const result = removeBalance(user.id, amount);
      if (result === null) {
        await interaction.reply({ content: `❌ Saldo insuficiente!`, ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder().setColor('#ff6b6b').setTitle('💔 Removido').setDescription(`${amount} Akita Neru removido de <@${user.id}>! Saldo: **${result}**`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  setneru: {
    data: new SlashCommandBuilder()
      .setName('setneru')
      .setDescription('[ADMIN] Definir Akita Neru')
      .addUserOption(option => option.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(option => option.setName('quantidade').setDescription('Quantidade').setRequired(true).setMinValue(0)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('quantidade');
      setBalance(user.id, amount);
      const embed = new EmbedBuilder().setColor('#0099ff').setTitle('⚡ Definido').setDescription(`Saldo de <@${user.id}> definido para **${amount}**!`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  addxp: {
    data: new SlashCommandBuilder()
      .setName('addxp')
      .setDescription('[ADMIN] Adicionar XP')
      .addUserOption(option => option.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(option => option.setName('quantidade').setDescription('XP').setRequired(true).setMinValue(1)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('quantidade');
      const result = addXPDirect(user.id, amount);
      const embed = new EmbedBuilder().setColor('#9966ff').setTitle('⭐ XP Adicionado').setDescription(`${amount} XP para <@${user.id}>! Nível: **${result.level}**`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  removexp: {
    data: new SlashCommandBuilder()
      .setName('removexp')
      .setDescription('[ADMIN] Remover XP')
      .addUserOption(option => option.setName('usuario').setDescription('Usuário').setRequired(true))
      .addIntegerOption(option => option.setName('quantidade').setDescription('XP').setRequired(true).setMinValue(1)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('quantidade');
      const result = removeXPDirect(user.id, amount);
      if (result === null) {
        await interaction.reply({ content: '❌ XP insuficiente!', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder().setColor('#ff9966').setTitle('💫 XP Removido').setDescription(`${amount} XP removido de <@${user.id}>! Nível: **${result.level}**`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  addadmin: {
    data: new SlashCommandBuilder()
      .setName('addadmin')
      .setDescription('[ADMIN] Promover a admin')
      .addUserOption(option => option.setName('usuario').setDescription('Usuário').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      if (isAdmin(user.id)) {
        await interaction.reply({ content: `⚠️ Já é admin!`, ephemeral: true });
        return;
      }
      addAdmin(user.id);
      const embed = new EmbedBuilder().setColor('#00ff00').setTitle('👑 Novo Admin').setDescription(`<@${user.id}> foi promovido!`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  removeadmin: {
    data: new SlashCommandBuilder()
      .setName('removeadmin')
      .setDescription('[ADMIN] Remover admin')
      .addUserOption(option => option.setName('usuario').setDescription('Admin a remover').setRequired(true)),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      if (!isAdmin(user.id)) {
        await interaction.reply({ content: `⚠️ <@${user.id}> não é admin!`, ephemeral: true });
        return;
      }
      removeAdmin(user.id);
      const embed = new EmbedBuilder().setColor('#ff0000').setTitle('🔴 Removido').setDescription(`<@${user.id}> não é mais admin.`);
      await interaction.reply({ embeds: [embed] });
    }
  },

  admins: {
    data: new SlashCommandBuilder()
      .setName('admins')
      .setDescription('[ADMIN] Lista de admins'),
    execute: async (interaction) => {
      const adminsList = getAdmins();
      const embed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('👑 Admins')
        .setDescription(adminsList.length > 0 ? adminsList.map((id, i) => `${i + 1}. <@${id}>`).join('\n') : 'Nenhum admin!')
        .setFooter({ text: `Total: ${adminsList.length}` });
      await interaction.reply({ embeds: [embed] });
    }
  },

  editserver: {
    data: new SlashCommandBuilder()
      .setName('editserver')
      .setDescription('[ADMIN] Editar descrição do servidor')
      .addStringOption(option =>
        option.setName('descricao')
          .setDescription('Nova descrição do servidor')
          .setRequired(true)
          .setMaxLength(120)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }

      const descricao = interaction.options.getString('descricao');

      try {
        await interaction.guild.edit({ description: descricao });
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✨ Servidor Editado')
          .setDescription(`Descrição alterada para:\n\n${descricao}`);
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao editar servidor:', error);
        await interaction.reply({ content: '❌ Erro ao editar servidor!', ephemeral: true });
      }
    }
  },

  renamechannel: {
    data: new SlashCommandBuilder()
      .setName('renamechannel')
      .setDescription('[ADMIN] Renomear um canal')
      .addChannelOption(option =>
        option.setName('canal')
          .setDescription('Canal a ser renomeado')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('novonome')
          .setDescription('Novo nome do canal')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }

      const canal = interaction.options.getChannel('canal');
      const novoNome = interaction.options.getString('novonome');

      try {
        await canal.edit({ name: novoNome });
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✨ Canal Renomeado')
          .setDescription(`<#${canal.id}> agora é **${novoNome}**`);
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao renomear canal:', error);
        await interaction.reply({ content: '❌ Erro ao renomear canal!', ephemeral: true });
      }
    }
  },

  edittopic: {
    data: new SlashCommandBuilder()
      .setName('edittopic')
      .setDescription('[ADMIN] Editar tópico de um canal')
      .addChannelOption(option =>
        option.setName('canal')
          .setDescription('Canal para editar o tópico')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('topico')
          .setDescription('Novo tópico do canal')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }

      const canal = interaction.options.getChannel('canal');
      const topico = interaction.options.getString('topico');

      try {
        await canal.edit({ topic: topico });
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✨ Tópico Atualizado')
          .setDescription(`Tópico de <#${canal.id}> agora é:\n\n${topico}`);
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao editar tópico:', error);
        await interaction.reply({ content: '❌ Erro ao editar tópico!', ephemeral: true });
      }
    }
  },

  createchannel: {
    data: new SlashCommandBuilder()
      .setName('createchannel')
      .setDescription('[ADMIN] Criar um novo canal no servidor')
      .addStringOption(option =>
        option.setName('nome')
          .setDescription('Nome do canal')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('tipo')
          .setDescription('Tipo do canal')
          .setRequired(true)
          .addChoices(
            { name: 'Texto', value: 'texto' },
            { name: 'Voz', value: 'voz' }
          )
      )
      .addChannelOption(option =>
        option.setName('categoria')
          .setDescription('Categoria (opcional)')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const nome = interaction.options.getString('nome');
      const tipo = interaction.options.getString('tipo');
      const categoria = interaction.options.getChannel('categoria');

      try {
        const novoCanal = await interaction.guild.channels.create({
          name: nome,
          type: tipo === 'voz' ? 2 : 0,
          parent: categoria ? categoria.id : undefined
        });

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✨ Canal Criado')
          .setDescription(`Canal <#${novoCanal.id}> foi criado com sucesso! 🎉`);
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao criar canal:', error);
        await interaction.reply({ content: '❌ Erro ao criar canal!', ephemeral: true });
      }
    }
  },

  createrole: {
    data: new SlashCommandBuilder()
      .setName('createrole')
      .setDescription('[ADMIN] Criar um novo cargo no servidor')
      .addStringOption(option =>
        option.setName('nome')
          .setDescription('Nome do cargo')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('cor')
          .setDescription('Cor do cargo (hex: #FF0000)')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const nome = interaction.options.getString('nome');
      const cor = interaction.options.getString('cor') || '#0099ff';

      try {
        const novoCargo = await interaction.guild.roles.create({
          name: nome,
          color: cor,
          reason: `Cargo criado pelo bot`
        });

        const embed = new EmbedBuilder()
          .setColor(cor)
          .setTitle('✨ Cargo Criado')
          .setDescription(`Cargo **${novoCargo.name}** foi criado com sucesso! 🎉`)
          .addFields(
            { name: 'ID', value: `\`${novoCargo.id}\``, inline: true },
            { name: 'Cor', value: `\`${cor}\``, inline: true }
          );
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao criar cargo:', error);
        await interaction.reply({ content: '❌ Erro ao criar cargo!', ephemeral: true });
      }
    }
  },

  setrestartchannel: {
    data: new SlashCommandBuilder()
      .setName('setrestartchannel')
      .setDescription('[ADMIN] Configurar canal para notificação de reinicialização do bot')
      .addChannelOption(option =>
        option.setName('canal')
          .setDescription('Canal que receberá as notificações')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }

      const canal = interaction.options.getChannel('canal');

      try {
        setRestartChannel(canal.id);
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✨ Canal Configurado')
          .setDescription(`<#${canal.id}> foi configurado para receber notificações de reinicialização! 🔔`)
          .addFields(
            { name: 'Notificações Ativadas', value: 'Quando o bot reiniciar, uma mensagem será enviada aqui com motivo e tempo estimado.', inline: false }
          );
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao configurar canal:', error);
        await interaction.reply({ content: '❌ Erro ao configurar canal!', ephemeral: true });
      }
    }
  },

  createembed: {
    data: new SlashCommandBuilder()
      .setName('createembed')
      .setDescription('[ADMIN] Criar uma embed personalizada')
      .addStringOption(option =>
        option.setName('titulo')
          .setDescription('Título da embed')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('descricao')
          .setDescription('Descrição da embed')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('cor')
          .setDescription('Cor da embed em hexadecimal (ex: #FF0000)')
          .setRequired(false)
      )
      .addChannelOption(option =>
        option.setName('canal')
          .setDescription('Canal onde a embed será enviada (padrão: canal atual)')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('imagem')
          .setDescription('URL da imagem para a embed')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('thumbnail')
          .setDescription('URL do thumbnail para a embed')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('footer')
          .setDescription('Texto do rodapé da embed')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      // Verificar se o usuário tem permissão de Administrador
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({
          content: '❌ Você precisa ter a permissão de Administrador para usar este comando!',
          ephemeral: true
        });
        return;
      }

      const titulo = interaction.options.getString('titulo');
      const descricao = interaction.options.getString('descricao');
      const cor = interaction.options.getString('cor') || '#0a0a0a';
      const canal = interaction.options.getChannel('canal') || interaction.channel;
      const imagem = interaction.options.getString('imagem');
      const thumbnail = interaction.options.getString('thumbnail');
      const footer = interaction.options.getString('footer');

      try {
        const embed = new EmbedBuilder()
          .setColor(cor)
          .setTitle(titulo)
          .setDescription(descricao)
          .setTimestamp();

        if (imagem) {
          embed.setImage(imagem);
        }

        if (thumbnail) {
          embed.setThumbnail(thumbnail);
        }

        if (footer) {
          embed.setFooter({ text: footer });
        }

        await canal.send({ embeds: [embed] });

        const confirmEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Embed Criada')
          .setDescription(`A embed foi enviada com sucesso em <#${canal.id}>!`)
          .setFooter({ text: '*Criação artística completa.* 🖤' });

        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
      } catch (error) {
        console.error('Erro ao criar embed:', error);
        await interaction.reply({
          content: '❌ Erro ao criar a embed! Verifique se a cor está no formato correto (#HEXADECIMAL) e se as URLs são válidas.',
          ephemeral: true
        });
      }
    }
  },

  setmultiplier: {
    data: new SlashCommandBuilder()
      .setName('setmultiplier')
      .setDescription('[ADMIN] Define o multiplicador de daily (1x - 10x)')
      .addNumberOption(option =>
        option.setName('valor')
          .setDescription('Multiplicador (1 a 10)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(10)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      const multiplier = interaction.options.getNumber('valor');
      const success = setMultiplier(multiplier);

      if (!success) {
        await interaction.reply({ content: '❌ Erro ao definir multiplicador!', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🔥 Multiplicador Configurado!')
        .setDescription(`O multiplicador de daily foi definido para **${multiplier}x**!\n\nAgora todos ganharão **${50 * multiplier} Akita Neru** no daily!\n\n*O poder flui através das moedas...* 💰`)
        .setFooter({ text: `Configurado por: ${interaction.user.username}` });

      await interaction.reply({ embeds: [embed] });
    }
  },

  ticketpanel: {
    data: new SlashCommandBuilder()
      .setName('ticketpanel')
      .setDescription('[ADMIN] Enviar painel de tickets no canal atual'),
    execute: async (interaction) => {
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({ content: '❌ Você precisa ser Administrador!', ephemeral: true });
        return;
      }

      try {
        await sendTicketPanel(interaction.channel);
        await interaction.reply({ content: '✅ Painel de tickets enviado!', ephemeral: true });
      } catch (error) {
        console.error('Erro ao enviar painel:', error);
        await interaction.reply({ content: '❌ Erro ao enviar painel!', ephemeral: true });
      }
    }
  },

  ticketconfig: {
    data: new SlashCommandBuilder()
      .setName('ticketconfig')
      .setDescription('[ADMIN] Configurar sistema de tickets')
      .addSubcommand(subcommand =>
        subcommand
          .setName('category')
          .setDescription('Definir categoria onde tickets serão criados')
          .addChannelOption(option =>
            option.setName('categoria')
              .setDescription('Categoria para os tickets')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('supportrole')
          .setDescription('Definir cargo de suporte')
          .addRoleOption(option =>
            option.setName('cargo')
              .setDescription('Cargo que terá acesso aos tickets')
              .setRequired(true)
          )
      ),
    execute: async (interaction) => {
      if (!interaction.member.permissions.has('Administrator')) {
        await interaction.reply({ content: '❌ Você precisa ser Administrador!', ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'category') {
        const category = interaction.options.getChannel('categoria');
        setTicketCategory(interaction.guild.id, category.id);
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Categoria Configurada')
          .setDescription(`Categoria de tickets definida para: ${category}`)
          .setFooter({ text: 'Sistema de Tickets' });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else if (subcommand === 'supportrole') {
        const role = interaction.options.getRole('cargo');
        setSupportRole(interaction.guild.id, role.id);
        
        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Cargo de Suporte Configurado')
          .setDescription(`Cargo de suporte definido para: ${role}`)
          .setFooter({ text: 'Sistema de Tickets' });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },

  ticketstats: {
    data: new SlashCommandBuilder()
      .setName('ticketstats')
      .setDescription('Ver estatísticas de tickets'),
    execute: async (interaction) => {
      const stats = getTicketStats();
      
      const embed = new EmbedBuilder()
        .setColor('#00bfff')
        .setTitle('📊 Estatísticas de Tickets')
        .addFields(
          { name: '🟢 Abertos', value: `${stats.open}`, inline: true },
          { name: '🔴 Fechados', value: `${stats.closed}`, inline: true },
          { name: '📈 Total', value: `${stats.total}`, inline: true }
        )
        .setFooter({ text: 'Sistema de Tickets | Diva Bot' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },

  multiplier: {
    data: new SlashCommandBuilder()
      .setName('multiplier')
      .setDescription('Ver o multiplicador de daily atual'),
    execute: async (interaction) => {
      const multiplier = getMultiplier();

      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🔥 Multiplicador Atual')
        .setDescription(`O multiplicador de daily está em **${multiplier}x**!\n\nRecompensa atual: **${50 * multiplier} Akita Neru**\n\n*${multiplier > 1 ? 'Aproveite enquanto dura!' : 'Apenas o valor base.'}* 💰`)
        .setFooter({ text: 'Use /daily para coletar sua recompensa' });

      await interaction.reply({ embeds: [embed] });
    }
  },

  setautorole: {
    data: new SlashCommandBuilder()
      .setName('setautorole')
      .setDescription('[ADMIN] Configurar cargo automático ao entrar no servidor')
      .addRoleOption(option =>
        option.setName('cargo')
          .setDescription('Cargo que será dado automaticamente')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      const role = interaction.options.getRole('cargo');

      try {
        const { setAutoRole } = await import('./autorole.js');
        setAutoRole(interaction.guild.id, role.id);

        const embed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Auto Role Configurado')
          .setDescription(`O cargo ${role} será dado automaticamente para novos membros!\n\n*Bem-vindos serão marcados...* 🎭`)
          .setFooter({ text: `Configurado por: ${interaction.user.username}` });

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao configurar autorole:', error);
        await interaction.reply({ content: '❌ Erro ao configurar autorole!', ephemeral: true });
      }
    }
  },

  removeautorole: {
    data: new SlashCommandBuilder()
      .setName('removeautorole')
      .setDescription('[ADMIN] Remover cargo automático ao entrar no servidor'),
    execute: async (interaction) => {
      if (!isAdmin(interaction.user.id)) {
        await interaction.reply({ content: '❌ Sem permissão! Apenas admins.', ephemeral: true });
        return;
      }

      try {
        const { removeAutoRole } = await import('./autorole.js');
        removeAutoRole(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🗑️ Auto Role Removido')
          .setDescription('O cargo automático foi desativado!\n\n*Novos membros não receberão cargo automaticamente.*')
          .setFooter({ text: `Removido por: ${interaction.user.username}` });

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro ao remover autorole:', error);
        await interaction.reply({ content: '❌ Erro ao remover autorole!', ephemeral: true });
      }
    }
  },
};

export async function registerSlashCommands(client) {
  const commands = Object.values(slashCommands).map(cmd => cmd.data);

  // Registrar comandos imediatamente
  try {
    console.log('📝 Registrando slash commands...');
    await client.application.commands.set(commands);
    console.log('✅ Slash commands registrados!');
  } catch (error) {
    console.error('Erro ao registrar slash commands:', error);
  }
}

