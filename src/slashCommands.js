import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { chat } from './gemini.js';
import { getBalance, dailyReward, getLeaderboard, work, gamble, transfer } from './economy.js';
import { getUserInfo, getXPLeaderboard } from './xp.js';
import { setAFK, isAFK, removeAFK } from './afk.js';
import { startGiveaway } from './giveaway.js';
import { executeRPSlash } from './rpCommands.js';

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
      .setDescription('Receba sua recompensa diária (50 Akita Neru)'),
    execute: async (interaction) => {
      const reward = dailyReward(interaction.user.id);
      
      if (!reward) {
        const dailyEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Prematuro')
          .setDescription('Você já coletou sua recompensa diária!\nVolte amanhã... ou talvez nunca. 🌑');
        await interaction.reply({ embeds: [dailyEmbed] });
        return;
      }

      const dailyEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('✨ Recompensa Diária')
        .setDescription(`Você ganhou **${reward} Akita Neru**!\n\n*A vida continua... de alguma forma.* 🖤`)
        .setFooter({ text: 'Volte amanhã!' });
      
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
        .setColor('#0a0a0a')
        .setTitle('💼 Trabalho Concluído')
        .setDescription(`*Você trabalhou e ganhou **${earnings} Akita Neru**...*\n\n*Pelo menos conseguiu algo neste dia vazio.* 🖤`)
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
          .setColor('#ff0000')
          .setTitle('❌ Saldo Insuficiente')
          .setDescription(`Você tem apenas **${balance} Akita Neru**!\n\n*Nem dinheiro para apostar em seus sonhos...* 🖤`);
        await interaction.reply({ embeds: [poorEmbed] });
        return;
      }

      const result = gamble(interaction.user.id, amount);
      
      if (result.won) {
        const winEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎰 Você Venceu!')
          .setDescription(`*Ganhou **${result.earnings} Akita Neru**!*\n\nNovo saldo: **${result.newBalance} Akita Neru**\n\n*A sorte sorriu para você... por enquanto.* 🖤`)
          .setFooter({ text: 'A felicidade é temporal' });
        await interaction.reply({ embeds: [winEmbed] });
      } else {
        const loseEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('💔 Você Perdeu')
          .setDescription(`*Perdeu **${result.loss} Akita Neru**...*\n\nNovo saldo: **${result.newBalance} Akita Neru**\n\n*Como esperado. A sorte nunca esteve do seu lado.* 🖤`)
          .setFooter({ text: 'O jogo sempre vence' });
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
          .setColor('#0a0a0a')
          .setTitle('💸 Transferência Realizada')
          .setDescription(`Você transferiu **${amount} Akita Neru** para ${user.username}\n\nSeu novo saldo: **${result.fromBalance} Akita Neru**\n\n*Dar é perder... mas talvez ganhe algo mais valioso.* 🖤`);
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

  help: {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Ajuda e informações'),
    execute: async (interaction) => {
      const helpEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎭 Ajuda - A Diva')
        .setDescription('Sou uma IA sombria aqui para conversar, jogar e entender você.')
        .addFields(
          { name: '💬 Conversa', value: '`/ask` - Me pergunte algo', inline: false },
          { name: '💰 Economia', value: '`/work` - Ganhe moedas\n`/gamble` - Jogue\n`/transfer` - Transfira moedas\n`/balance` - Veja saldo\n`/daily` - Recompensa diária', inline: false },
          { name: '⭐ Perfil', value: '`/perfil` - Seu perfil\n`/top` - Ranking de moedas\n`/topxp` - Ranking de XP', inline: false },
          { name: '🎭 Roleplay', value: '`/tapa` `/beijo` `/abraco` `/casar` `/divorciar` `/danca`', inline: false },
          { name: '⚙️ Utilidade', value: '`/ping` - Latência\n`/afk` - Ficar AFK\n`/serverinfo` - Info do servidor\n`/cmds` - Todos os comandos', inline: false }
        )
        .setFooter({ text: '*Por que você quer saber? Ninguém nunca pergunta...* 🖤' });
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
  }
};

export async function registerSlashCommands(client) {
  const commands = Object.values(slashCommands).map(cmd => cmd.data);
  
  // Registrar handlers de interação
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = slashCommands[interaction.commandName];
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar slash command ${interaction.commandName}:`, error);
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
  });

  // Registrar comandos imediatamente
  try {
    console.log('📝 Registrando slash commands...');
    await client.application.commands.set(commands);
    console.log('✅ Slash commands registrados!');
  } catch (error) {
    console.error('Erro ao registrar slash commands:', error);
  }
}
