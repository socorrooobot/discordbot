import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

let confessionsChannelId = null;

export const confessionCommands = {
  setup: {
    name: 'configurar_confissoes',
    description: 'Configura o canal onde as confissões serão postadas (Admin)',
    execute: async (interaction) => {
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Apenas administradores podem configurar isso!', ephemeral: true });
      }
      
      confessionsChannelId = interaction.channelId;
      const embed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('💖 Canal de Confissões Configurado!')
        .setDescription(`Agora todas as confissões anônimas serão postadas neste canal.\n\nUse \`/confessar\` para enviar a sua!`)
        .setFooter({ text: 'Seus segredos estão seguros comigo... 🤫' });

      await interaction.reply({ embeds: [embed] });
    }
  },
  confess: {
    name: 'confessar',
    description: 'Envie uma confissão totalmente anônima',
    execute: async (interaction) => {
      if (!confessionsChannelId) {
        return interaction.reply({ content: '❌ O sistema de confissões ainda não foi configurado neste servidor!', ephemeral: true });
      }

      const confession = interaction.options.getString('mensagem');
      const channel = await interaction.guild.channels.fetch(confessionsChannelId);

      if (!channel) {
        return interaction.reply({ content: '❌ Não consegui encontrar o canal de confissões!', ephemeral: true });
      }

      const confessionEmbed = new EmbedBuilder()
        .setColor('#e91e63')
        .setTitle('🤫 Nova Confissão Anônima')
        .setDescription(confession)
        .setTimestamp()
        .setFooter({ text: 'Enviado anonimamente' });

      await channel.send({ embeds: [confessionEmbed] });
      await interaction.reply({ content: '✅ Sua confissão foi enviada com sucesso e anonimamente!', ephemeral: true });
    }
  }
};
