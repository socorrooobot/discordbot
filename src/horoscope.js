import { EmbedBuilder } from 'discord.js';
import { chat } from './gemini.js';

const signs = ['Áries', 'Touro', 'Gêmeos', 'Câncer', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário', 'Capricórnio', 'Aquário', 'Peixes'];

export const horoscopeCommands = {
  get: {
    name: 'horoscopo',
    description: 'Veja a previsão mística para o seu signo hoje!',
    execute: async (interaction) => {
      const sign = interaction.options.getString('signo');
      
      if (!signs.includes(sign)) {
        return interaction.reply({ content: '❌ Signo inválido! Escolha um dos 12 signos do zodíaco.', ephemeral: true });
      }

      await interaction.deferReply();

      try {
        const prompt = `Como uma vidente mística e um pouco melancólica, dê uma previsão curta (máximo 300 caracteres) para o signo de ${sign} hoje. Fale sobre amor, sorte e um aviso sombrio. Use um tom poético em português.`;
        const prediction = await chat(interaction.user.id, prompt);

        const embed = new EmbedBuilder()
          .setColor('#4b0082')
          .setTitle(`✨ Oráculo: ${sign}`)
          .setDescription(prediction)
          .setThumbnail('https://cdn-icons-png.flaticon.com/512/2646/2646141.png')
          .setFooter({ text: 'As estrelas não mentem, apenas omitem... 🖤' });

        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error('Erro no horóscopo:', error);
        await interaction.editReply('❌ As estrelas estão nubladas hoje... Tente novamente mais tarde. 🌑');
      }
    }
  }
};
