import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const suggestions = new Map();

export const cinemaCommands = {
  suggest: {
    name: 'sugerir_filme',
    description: 'Sugira um filme para o Clube de Cinema',
    execute: async (interaction) => {
      const movie = interaction.options.getString('filme');
      const userId = interaction.user.id;
      
      if (!suggestions.has(interaction.guildId)) {
        suggestions.set(interaction.guildId, []);
      }
      
      const guildSuggestions = suggestions.get(interaction.guildId);
      guildSuggestions.push({
        movie,
        suggestedBy: userId,
        votes: new Set(),
        timestamp: Date.now()
      });

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎬 Nova Sugestão de Filme!')
        .setDescription(`**${interaction.user.username}** sugeriu: **${movie}**`)
        .setFooter({ text: 'Use /votar_filme para escolher o próximo!' });

      await interaction.reply({ embeds: [embed] });
    }
  },
  vote: {
    name: 'votar_filme',
    description: 'Vote no filme para a próxima sessão',
    execute: async (interaction) => {
      const guildSuggestions = suggestions.get(interaction.guildId);
      
      if (!guildSuggestions || guildSuggestions.length === 0) {
        return interaction.reply({ content: '❌ Nenhuma sugestão aberta no momento!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🗳️ Votação do Clube de Cinema')
        .setDescription('Escolha o filme que você quer assistir:')
        .addFields(guildSuggestions.map((s, i) => ({
          name: `${i + 1}. ${s.movie}`,
          value: `Sugerido por: <@${s.suggestedBy}> | Votos: ${s.votes.size}`,
          inline: false
        })));

      const row = new ActionRowBuilder();
      guildSuggestions.slice(0, 5).forEach((s, i) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`vote_movie_${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }
};

export async function handleCinemaVote(interaction) {
  const index = parseInt(interaction.customId.replace('vote_movie_', ''));
  const guildSuggestions = suggestions.get(interaction.guildId);
  
  if (!guildSuggestions || !guildSuggestions[index]) return;
  
  const movie = guildSuggestions[index];
  if (movie.votes.has(interaction.user.id)) {
    movie.votes.delete(interaction.user.id);
    await interaction.reply({ content: `✅ Você removeu seu voto de **${movie.movie}**`, ephemeral: true });
  } else {
    movie.votes.add(interaction.user.id);
    await interaction.reply({ content: `✅ Você votou em **${movie.movie}**!`, ephemeral: true });
  }
}
