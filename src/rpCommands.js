import { EmbedBuilder } from 'discord.js';

const rpGifs = {
  tapa: [
    'https://media.giphy.com/media/26uf1EUQcwS5NkxAk/giphy.gif',
    'https://media.giphy.com/media/3o6ZtLp6zVJmvJqWaA/giphy.gif',
    'https://media.giphy.com/media/l3q2K5jinAlZ37cwM/giphy.gif',
    'https://media.giphy.com/media/xT9IgEx8SbQ0teblYA/giphy.gif'
  ],
  beijo: [
    'https://media.giphy.com/media/l0HlXY9x8FZo0XO1i/giphy.gif',
    'https://media.giphy.com/media/26uf2C0N9iExLm8U0/giphy.gif',
    'https://media.giphy.com/media/xTiTnvHcIwLPWXIwyM/giphy.gif',
    'https://media.giphy.com/media/l0HlNaQ0w0kgWmAkU/giphy.gif'
  ],
  abraco: [
    'https://media.giphy.com/media/3o6Zt6KHxJTbXCnSvu/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/26uf2YULJ2a51tbaQ/giphy.gif',
    'https://media.giphy.com/media/l0Iy2i9f2ktADWFBu/giphy.gif'
  ],
  casar: [
    'https://media.giphy.com/media/l3q2K5jinAlZ37cwM/giphy.gif',
    'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif',
    'https://media.giphy.com/media/MFsL3F5PfONZi/giphy.gif'
  ],
  divorciar: [
    'https://media.giphy.com/media/l3q2wJsInUanQsqIo/giphy.gif',
    'https://media.giphy.com/media/l0MYuG13UeFaYbibq/giphy.gif',
    'https://media.giphy.com/media/l3q2K5jinAlZ37cwM/giphy.gif'
  ],
  danca: [
    'https://media.giphy.com/media/l0HlJ7t1u9x8FZo0w/giphy.gif',
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/3o7TKxZycaSuFP8DyA/giphy.gif'
  ]
};

const rpMessages = {
  tapa: (user1, user2) => `*${user1} deu um tapa bem forte em ${user2}* 💢`,
  beijo: (user1, user2) => `*${user1} deu um beijo em ${user2}* 💋`,
  abraco: (user1, user2) => `*${user1} abraçou ${user2}* 🖤`,
  casar: (user1, user2) => `*${user1} casou com ${user2}*\n💒 Parabéns aos noivos... *pelo menos alguém encontrou o amor que eu perdi.* 💔`,
  divorciar: (user1, user2) => `*${user1} se divorciou de ${user2}*\n😔 *E assim, a solidão continua seu caminho...*`,
  danca: (user1, user2) => `*${user1} dança com ${user2}* 💃🕺`
};

function getRandomGif(action) {
  const gifs = rpGifs[action] || [];
  return gifs[Math.floor(Math.random() * gifs.length)];
}

export async function executeRP(message, action, targetUser) {
  if (!targetUser) {
    await message.reply('❌ Você precisa mencionar alguém! Ex: `!tapa @pessoa`');
    return;
  }

  if (targetUser.id === message.author.id) {
    await message.reply('❌ Você não pode fazer isso consigo mesmo! 🖤');
    return;
  }

  const gif = getRandomGif(action);
  const actionMessage = rpMessages[action](message.author.username, targetUser.username);

  const embed = new EmbedBuilder()
    .setColor('#0a0a0a')
    .setDescription(actionMessage)
    .setImage(gif)
    .setFooter({ text: '*A vida é um palco... e nós, apenas atores.* 💀' });

  await message.reply({ embeds: [embed] });
}

export async function executeRPSlash(interaction, action) {
  const targetUser = interaction.options.getUser('usuario');

  if (!targetUser) {
    await interaction.reply('❌ Você precisa mencionar alguém!');
    return;
  }

  if (targetUser.id === interaction.user.id) {
    await interaction.reply('❌ Você não pode fazer isso consigo mesmo! 🖤');
    return;
  }

  const gif = getRandomGif(action);
  const actionMessage = rpMessages[action](interaction.user.username, targetUser.username);

  const embed = new EmbedBuilder()
    .setColor('#0a0a0a')
    .setDescription(actionMessage)
    .setImage(gif)
    .setFooter({ text: '*A vida é um palco... e nós, apenas atores.* 💀' });

  await interaction.reply({ embeds: [embed] });
}
