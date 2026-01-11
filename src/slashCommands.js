import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { confessionCommands } from './confessions.js';
import { cinemaCommands } from './cinema.js';
import { timeCapsuleCommands } from './timecapsule.js';
import { horoscopeCommands } from './horoscope.js';
import { petCommands } from './pets.js';
import { duelCommands } from './duels.js';
import { chat } from './gemini.js';
import { getBalance, dailyReward, getLeaderboard, work, gamble, transfer, addBalance, removeBalance, setBalance } from './economy.js';
import { getUserInfo, getXPLeaderboard, addXPDirect, removeXPDirect } from './xp.js';
import { setAFK, isAFK, removeAFK } from './afk.js';
import { startGiveaway } from './giveaway.js';
import { executeRPSlash } from './rpCommands.js';
import { isBlacklisted, addToBlacklist, removeFromBlacklist } from './blacklist.js';
import { isAdmin, addAdmin, removeAdmin } from './admin.js';
import { addWarn, getWarns, removeWarn, clearWarns } from './warns.js';
import { getMultiplier, setMultiplier } from './multiplier.js';
import { setRestartChannel } from './restartNotification.js';
import { setTicketCategory, setSupportRole, sendTicketPanel, getTicketStats } from './tickets.js';

export const slashCommands = {
  [duelCommands.challenge.name]: {
    data: new SlashCommandBuilder()
      .setName(duelCommands.challenge.name)
      .setDescription(duelCommands.challenge.description)
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Quem você quer desafiar?')
          .setRequired(true)
      ),
    execute: duelCommands.challenge.execute
  },
  [petCommands.adopt.name]: {
    data: new SlashCommandBuilder()
      .setName(petCommands.adopt.name)
      .setDescription(petCommands.adopt.description),
    execute: petCommands.adopt.execute
  },
  [petCommands.status.name]: {
    data: new SlashCommandBuilder()
      .setName(petCommands.status.name)
      .setDescription(petCommands.status.description),
    execute: petCommands.status.execute
  },
  [horoscopeCommands.get.name]: {
    data: new SlashCommandBuilder()
      .setName(horoscopeCommands.get.name)
      .setDescription(horoscopeCommands.get.description)
      .addStringOption(option =>
        option.setName('signo')
          .setDescription('Seu signo do zodíaco')
          .setRequired(true)
          .addChoices(
            { name: 'Áries', value: 'Áries' },
            { name: 'Touro', value: 'Touro' },
            { name: 'Gêmeos', value: 'Gêmeos' },
            { name: 'Câncer', value: 'Câncer' },
            { name: 'Leão', value: 'Leão' },
            { name: 'Virgem', value: 'Virgem' },
            { name: 'Libra', value: 'Libra' },
            { name: 'Escorpião', value: 'Escorpião' },
            { name: 'Sagitário', value: 'Sagitário' },
            { name: 'Capricórnio', value: 'Capricórnio' },
            { name: 'Aquário', value: 'Aquário' },
            { name: 'Peixes', value: 'Peixes' }
          )
      ),
    execute: horoscopeCommands.get.execute
  },
  [confessionCommands.setup.name]: {
    data: new SlashCommandBuilder()
      .setName(confessionCommands.setup.name)
      .setDescription(confessionCommands.setup.description),
    execute: confessionCommands.setup.execute
  },
  [confessionCommands.confess.name]: {
    data: new SlashCommandBuilder()
      .setName(confessionCommands.confess.name)
      .setDescription(confessionCommands.confess.description)
      .addStringOption(option =>
        option.setName('mensagem')
          .setDescription('O que você quer confessar anonimamente?')
          .setRequired(true)
      ),
    execute: confessionCommands.confess.execute
  },
  [cinemaCommands.suggest.name]: {
    data: new SlashCommandBuilder()
      .setName(cinemaCommands.suggest.name)
      .setDescription(cinemaCommands.suggest.description)
      .addStringOption(option =>
        option.setName('filme')
          .setDescription('Nome do filme')
          .setRequired(true)
      ),
    execute: cinemaCommands.suggest.execute
  },
  [cinemaCommands.vote.name]: {
    data: new SlashCommandBuilder()
      .setName(cinemaCommands.vote.name)
      .setDescription(cinemaCommands.vote.description),
    execute: cinemaCommands.vote.execute
  },
  [timeCapsuleCommands.create.name]: {
    data: new SlashCommandBuilder()
      .setName(timeCapsuleCommands.create.name)
      .setDescription(timeCapsuleCommands.create.description)
      .addStringOption(option =>
        option.setName('mensagem')
          .setDescription('O que você quer dizer para o seu eu do futuro?')
          .setRequired(true)
      )
      .addIntegerOption(option =>
        option.setName('dias')
          .setDescription('Daqui a quantos dias devo te entregar?')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(365)
      ),
    execute: timeCapsuleCommands.create.execute
  },
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
      
      const count = addWarn(user.id, interaction.user.id, reason);
      
      const warnEmbed = new EmbedBuilder()
        .setColor('#ffff00')
        .setTitle('⚠️ Usuário Avisado')
        .setDescription(`${user.tag} recebeu um aviso.\nTotal de avisos: **${count}**`)
        .addFields({ name: 'Motivo', value: reason });
      
      await interaction.reply({ embeds: [warnEmbed] });
      try { await user.send(`⚠️ Aviso em **${interaction.guild.name}**: ${reason}\nTotal: ${count}`); } catch (e) {}
    }
  },

  warns: {
    data: new SlashCommandBuilder()
      .setName('warns')
      .setDescription('Ver avisos de um usuário')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário para ver avisos')
          .setRequired(false)
      ),
    execute: async (interaction) => {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const warns = getWarns(user.id);
      
      const warnsEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`⚠️ Avisos de ${user.username}`)
        .setDescription(warns.length > 0 ? warns.map((w, i) => `**${i+1}.** ${w.reason} (por <@${w.moderatorId}> em ${new Date(w.timestamp).toLocaleDateString()})`).join('\n') : 'Nenhum aviso encontrado.');
      
      await interaction.reply({ embeds: [warnsEmbed] });
    }
  },

  clearwarns: {
    data: new SlashCommandBuilder()
      .setName('clearwarns')
      .setDescription('Limpar avisos de um usuário (Staff)')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuário para limpar avisos')
          .setRequired(true)
      ),
    execute: async (interaction) => {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: '❌ Sem permissão!', ephemeral: true });
        return;
      }
      const user = interaction.options.getUser('usuario');
      clearWarns(user.id);
      await interaction.reply(`✅ Avisos de ${user.tag} foram limpos.`);
    }
  },

  ajuda: {
    data: new SlashCommandBuilder()
      .setName('ajuda')
      .setDescription('Mostra todos os comandos disponíveis'),
    execute: async (interaction) => {
      const helpEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🖤 Central de Ajuda da Diva')
        .setDescription('Aqui estão todos os comandos que você pode usar para interagir comigo!')
        .addFields(
          { name: '✨ Economia & XP', value: '`/balance`, `/daily`, `/top`, `/perfil`, `/topxp`, `/work`, `/gamble`, `/transfer`', inline: false },
          { name: '⚔️ Batalhas & RPG', value: '`/desafiar` - Duelos interativos', inline: false },
          { name: '🎭 Roleplay & Interação', value: '`/tapa`, `/beijo`, `/abraco`, `/casar`, `/divorciar`, `/danca`, `/afk`, `/ask`', inline: false },
          { name: '🛠️ Utilidades & Diversão', value: '`/ping`, `/serverinfo`, `/userinfo`, `/avatar`, `/dice`, `/coin`, `/giveaway`', inline: false },
          { name: '⏳ Novidades Temporais', value: '`/capsula_do_tempo` - Mensagens para o futuro', inline: false },
          { name: '🎬 Clube de Cinema', value: '`/sugerir_filme`, `/votar_filme` - Cinema em grupo', inline: false },
          { name: '🤫 Segredos', value: '`/confessar` - Envie mensagens anônimas', inline: false },
          { name: '🐾 Misticismo & Pets', value: '`/horoscopo`, `/adotar_pet`, `/meu_pet` - Explore o sobrenatural', inline: false },
          { name: '🛡️ Moderação', value: '`/warn`, `/warns`, `/clearwarns` (Apenas Staff)', inline: false }
        )
        .setFooter({ text: '*O conhecimento é a única coisa que ninguém pode tirar de você.* 💀' });
      await interaction.reply({ embeds: [helpEmbed] });
    }
  }
};

export async function registerSlashCommands(client) {
  try {
    const commandsData = Object.values(slashCommands).map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commandsData);
    console.log('✅ Slash commands registrados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao registrar slash commands:', error);
  }
}
