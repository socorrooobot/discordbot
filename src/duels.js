import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const activeDuels = new Map();

export const duelCommands = {
  challenge: {
    name: 'desafiar',
    description: 'Desafie alguém para um duelo de RPG!',
    execute: async (interaction) => {
      const target = interaction.options.getUser('usuario');
      if (target.id === interaction.user.id) return interaction.reply({ content: '❌ Você não pode se desafiar!', ephemeral: true });
      if (target.bot) return interaction.reply({ content: '❌ Você não pode desafiar um bot!', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('⚔️ Desafio de Duelo!')
        .setDescription(`<@${interaction.user.id}> desafiou <@${target.id}> para um duelo mortal!\n\nVocê aceita o desafio?`)
        .setFooter({ text: 'O perdedor perderá XP e dignidade... 💀' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`duel_accept_${interaction.user.id}_${target.id}`)
            .setLabel('Aceitar')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`duel_decline_${interaction.user.id}_${target.id}`)
            .setLabel('Recusar')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({ content: `<@${target.id}>`, embeds: [embed], components: [row] });
    }
  }
};

export async function handleDuelInteraction(interaction) {
  const [action, challengerId, targetId] = interaction.customId.split('_');
  
  if (interaction.user.id !== targetId) {
    return interaction.reply({ content: '❌ Este desafio não é para você!', ephemeral: true });
  }

  if (action === 'duel_decline') {
    return interaction.update({ content: '💔 O desafio foi recusado. Covardia...', embeds: [], components: [] });
  }

  // Lógica do Duelo
  const challengerHP = 100;
  const targetHP = 100;
  
  const duelEmbed = new EmbedBuilder()
    .setColor('#f1c40f')
    .setTitle('⚔️ O Duelo Começou!')
    .setDescription(`<@${challengerId}> vs <@${targetId}>\n\n**Status:**\n❤️ <@${challengerId}>: ${challengerHP} HP\n❤️ <@${targetId}>: ${targetHP} HP`)
    .setFooter({ text: 'Calculando o destino das almas...' });

  await interaction.update({ embeds: [duelEmbed], components: [] });

  // Simulação rápida
  setTimeout(async () => {
    const winnerId = Math.random() > 0.5 ? challengerId : targetId;
    const loserId = winnerId === challengerId ? targetId : challengerId;
    
    const winEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('🏆 Duelo Finalizado!')
      .setDescription(`O vencedor é <@${winnerId}>!\n\n<@${loserId}> caiu em batalha e perdeu 50 XP.`)
      .setFooter({ text: 'A Diva observa o sangue derramado... 🖤' });

    await interaction.editReply({ embeds: [winEmbed] });
  }, 3000);
}
