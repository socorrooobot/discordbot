import fs from 'fs';
import { AttachmentBuilder } from 'discord.js';

const GOODBYE_CHANNEL_ID = '1439242695632752752';
const SAD_MIKU_PATH = 'data/sad_miku.png';

export async function sendGoodbyeMessage(client, user) {
  try {
    const channel = await client.channels.fetch(GOODBYE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    let attachment;
    if (fs.existsSync(SAD_MIKU_PATH)) {
      attachment = new AttachmentBuilder(SAD_MIKU_PATH, { name: 'sad_miku.png' });
    }

    const userAvatar = user ? user.displayAvatarURL({ extension: 'png', size: 256 }) : null;
    const userName = user ? user.username : 'Usuário';

    const embed = {
      color: 0x9370DB,
      title: '💜 Até Logo...',
      description: `😢 **${userName}** deixou o servidor. Vamos sentir sua falta!`,
      image: { url: 'attachment://sad_miku.png' },
      thumbnail: userAvatar ? { url: userAvatar } : undefined,
      footer: { text: 'Espero que volte em breve... 💙' },
      timestamp: new Date().toISOString()
    };

    const options = { embeds: [embed] };
    if (attachment) {
      options.files = [attachment];
    }

    await channel.send(options);
    console.log(`✅ Mensagem de adeus enviada para ${userName}!`);
  } catch (error) {
    console.error('Erro ao enviar mensagem de adeus:', error);
  }
}
