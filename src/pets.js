import { EmbedBuilder } from 'discord.js';
import fs from 'fs';

const DATA_FILE = './data/pets.json';

let pets = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    pets = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {}
}

function savePets() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(pets, null, 2));
}

const petTypes = [
  { name: 'Gato Sombrio', emoji: '🐈‍⬛', rarity: 'Comum' },
  { name: 'Corvo Mensageiro', emoji: '🐦‍⬛', rarity: 'Comum' },
  { name: 'Morcego da Noite', emoji: '🦇', rarity: 'Raro' },
  { name: 'Aranha de Seda', emoji: '🕷️', rarity: 'Raro' },
  { name: 'Dragão de Porcelana', emoji: '🐉', rarity: 'Épico' },
  { name: 'Fênix Negra', emoji: '🐦', rarity: 'Lendário' }
];

export const petCommands = {
  adopt: {
    name: 'adotar_pet',
    description: 'Adote um companheiro místico!',
    execute: async (interaction) => {
      if (pets[interaction.user.id]) {
        return interaction.reply({ content: '❌ Você já tem um companheiro! Cuide bem dele. 🖤', ephemeral: true });
      }

      const randomPet = petTypes[Math.floor(Math.random() * petTypes.length)];
      pets[interaction.user.id] = {
        ...randomPet,
        level: 1,
        hunger: 100,
        happiness: 100,
        adoptedAt: Date.now()
      };
      
      savePets();

      const embed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle(`✨ Novo Companheiro!`)
        .setDescription(`Você adotou um **${randomPet.name}** ${randomPet.emoji}!\n\nRaridade: **${randomPet.rarity}**`)
        .setFooter({ text: 'Use /meu_pet para interagir com ele!' });

      await interaction.reply({ embeds: [embed] });
    }
  },
  status: {
    name: 'meu_pet',
    description: 'Veja o status do seu companheiro místico',
    execute: async (interaction) => {
      const pet = pets[interaction.user.id];
      if (!pet) return interaction.reply({ content: '❌ Você ainda não tem um pet! Use /adotar_pet.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`${pet.emoji} ${pet.name}`)
        .addFields(
          { name: '⭐ Nível', value: `${pet.level}`, inline: true },
          { name: '🍖 Fome', value: `${pet.hunger}%`, inline: true },
          { name: '💖 Felicidade', value: `${pet.happiness}%`, inline: true }
        )
        .setFooter({ text: 'Cuide bem dele para que ele não fuja para o vazio... 🖤' });

      await interaction.reply({ embeds: [embed] });
    }
  }
};
