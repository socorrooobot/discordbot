import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { chat } from './gemini.js';
import { getBalance, dailyReward, getLeaderboard } from './economy.js';
import { getUserInfo, getXPLeaderboard } from './xp.js';
import { setAFK, isAFK } from './afk.js';
import { startGiveaway } from './giveaway.js';

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
        .setFooter({ text: 'Página 1 de 2' });

      const embed2 = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('💰 Slash Commands - Economia')
        .addFields(
          { name: '💵 Moeda', value: '`/balance` - Ver saldo\n`/daily` - Recompensa diária\n`/top` - Ranking', inline: false },
          { name: '⭐ XP', value: '`/perfil` - Seu perfil\n`/topxp` - Ranking de XP', inline: false }
        )
        .setFooter({ text: 'Página 2 de 2 - Use ! para comandos com prefixo' });

      await interaction.reply({ embeds: [embed1, embed2] });
    }
  }
};

export function registerSlashCommands(client) {
  const commands = Object.values(slashCommands).map(cmd => cmd.data);
  
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

  // Registrar comandos quando o bot fica online
  client.once('ready', async () => {
    try {
      console.log('📝 Registrando slash commands...');
      await client.application.commands.set(commands);
      console.log('✅ Slash commands registrados!');
    } catch (error) {
      console.error('Erro ao registrar slash commands:', error);
    }
  });
}
