import { EmbedBuilder } from 'discord.js';
import fs from 'fs';

const DATA_FILE = './data/timecapsules.json';

// Garantir que a pasta data existe
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Carregar dados
let capsules = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    capsules = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Erro ao carregar cápsulas:', e);
  }
}

function saveCapsules() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(capsules, null, 2));
}

export const timeCapsuleCommands = {
  create: {
    name: 'capsula_do_tempo',
    description: 'Envie uma mensagem para o seu "eu" do futuro!',
    execute: async (interaction) => {
      const message = interaction.options.getString('mensagem');
      const days = interaction.options.getInteger('dias');
      
      const releaseDate = Date.now() + (days * 24 * 60 * 60 * 1000);
      
      capsules.push({
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        message,
        createdAt: Date.now(),
        releaseAt: releaseDate,
        delivered: false
      });
      
      saveCapsules();

      const embed = new EmbedBuilder()
        .setColor('#9b59b6')
        .setTitle('⏳ Cápsula do Tempo Selada!')
        .setDescription(`Sua mensagem foi guardada em uma fenda temporal.\n\nEu vou te entregar ela em **${days} dias** (${new Date(releaseDate).toLocaleDateString('pt-BR')}).`)
        .setFooter({ text: 'O tempo é a única coisa que não podemos recuperar... 🖤' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};

export async function checkCapsules(client) {
  const now = Date.now();
  let changed = false;

  for (const capsule of capsules) {
    if (!capsule.delivered && now >= capsule.releaseAt) {
      try {
        const user = await client.users.fetch(capsule.userId);
        const embed = new EmbedBuilder()
          .setColor('#9b59b6')
          .setTitle('⌛ A Cápsula do Tempo foi Aberta!')
          .setDescription(`**Mensagem enviada em ${new Date(capsule.createdAt).toLocaleDateString('pt-BR')}:**\n\n${capsule.message}`)
          .setFooter({ text: 'O futuro chegou. Você ainda é o mesmo? 🖤' });

        await user.send({ embeds: [embed] });
        capsule.delivered = true;
        changed = true;
      } catch (error) {
        console.error(`Erro ao entregar cápsula para ${capsule.userId}:`, error);
      }
    }
  }

  if (changed) {
    capsules = capsules.filter(c => !c.delivered);
    saveCapsules();
  }
}
