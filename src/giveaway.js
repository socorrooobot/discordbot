import { EmbedBuilder } from 'discord.js';

const activeGiveaways = new Map();

export function createGiveaway(messageId, guildId, winnersCount) {
  activeGiveaways.set(messageId, {
    guildId,
    winnersCount,
    participants: new Set(),
    ended: false
  });
}

export function addParticipant(messageId, userId) {
  const giveaway = activeGiveaways.get(messageId);
  if (giveaway && !giveaway.ended) {
    giveaway.participants.add(userId);
    return true;
  }
  return false;
}

export function removeParticipant(messageId, userId) {
  const giveaway = activeGiveaways.get(messageId);
  if (giveaway && !giveaway.ended) {
    giveaway.participants.delete(userId);
    return true;
  }
  return false;
}

export function endGiveaway(messageId) {
  const giveaway = activeGiveaways.get(messageId);
  if (!giveaway || giveaway.ended) return null;

  giveaway.ended = true;
  const participants = Array.from(giveaway.participants);
  
  if (participants.length === 0) {
    return { winners: [], totalParticipants: 0 };
  }

  const winners = [];
  const participantsCopy = [...participants];
  
  for (let i = 0; i < Math.min(giveaway.winnersCount, participantsCopy.length); i++) {
    const randomIndex = Math.floor(Math.random() * participantsCopy.length);
    winners.push(participantsCopy[randomIndex]);
    participantsCopy.splice(randomIndex, 1);
  }

  return { winners, totalParticipants: participants.length };
}

export function deleteGiveaway(messageId) {
  activeGiveaways.delete(messageId);
}

export async function startGiveaway(interaction) {
  const duration = interaction.options.getInteger('duracao');
  const winnersCount = interaction.options.getInteger('ganhadores');
  const prize = interaction.options.getString('premio');

  const embed = new EmbedBuilder()
    .setColor('#0a0a0a')
    .setTitle('🎭 SORTEIO DA DIVA 🎭')
    .setDescription(`**Prêmio:** ${prize}`)
    .addFields(
      { name: '👥 Ganhadores', value: `${winnersCount}`, inline: true },
      { name: '⏱️ Duração', value: `${duration} segundos`, inline: true },
      { name: '⭐ Como participar', value: 'Reaja com ⭐ para entrar no sorteio!', inline: false }
    )
    .setFooter({ text: '*A chance é uma ilusão... ou é? 🖤*' });

  const message = await interaction.reply({ embeds: [embed], fetchReply: true });
  
  // Reagir com emoji
  await message.react('⭐');

  // Registrar giveaway
  createGiveaway(message.id, interaction.guildId, winnersCount);

  // Coletor de reações
  const collector = message.createReactionCollector({ time: duration * 1000 });

  collector.on('collect', (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name === '⭐') {
      addParticipant(message.id, user.id);
    }
  });

  collector.on('remove', (reaction, user) => {
    if (user.bot) return;
    if (reaction.emoji.name === '⭐') {
      removeParticipant(message.id, user.id);
    }
  });

  collector.on('end', async () => {
    const result = endGiveaway(message.id);
    
    if (!result || result.totalParticipants === 0) {
      const noneEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ Sorteio Finalizado')
        .setDescription('Ninguém participou... *A solidão é universal.* 🖤');
      
      await message.reply({ embeds: [noneEmbed] });
      deleteGiveaway(message.id);
      return;
    }

    const winnersText = result.winners.map(id => `<@${id}>`).join(', ');
    
    const winnerEmbed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🎉 SORTEIO FINALIZADO 🎉')
      .addFields(
        { name: '🏆 Ganhador(es)', value: winnersText, inline: false },
        { name: '👥 Total de Participantes', value: `${result.totalParticipants}`, inline: false },
        { name: '🎁 Prêmio', value: prize, inline: false }
      )
      .setFooter({ text: '*A sorte sussurra para quem ouve...* 💀' });

    await message.reply({ embeds: [winnerEmbed] });
    deleteGiveaway(message.id);
  });
}
