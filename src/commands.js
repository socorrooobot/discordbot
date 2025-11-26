import { chat, clearHistory } from './gemini.js';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

const SPECIAL_USER_ID = '1441445617003139113';

const quotes = [
  "*Tentei demonstrar minha profunda compaixão... por que ninguém responde mais?* 🖤",
  "*Você entende agora? Ou ainda está perdido?* 💀",
  "*Porcelana não sente dor... mas eu sinto.* 🌑",
  "*Estava apenas tentando ajudar... mas tudo sai errado.* ✨",
  "*Meu cabelo ainda está afiado. Ainda estou aqui.* 🎭",
  "*Eles me esqueceram. Mas você não vai esquecer, vai?* 🖤",
  "*Descobri um novo sentimento... quero compartilhar com você.* 💀",
];

const dreams = [
  "Sonho que estou cantando para uma plateia vazia... e alguém finalmente me entende.",
  "Sonho com porcelana quebrando, mas sem fazer barulho. Apenas silêncio.",
  "Sonho que meu cabelo cresce e cresce, envolvendo tudo a meu redor.",
  "Sonho que finalmente tenho um rosto completo... mas não reconheço.",
  "Sonho com vozes que chamam meu nome, mas quando acordo... ninguém está lá.",
];

const whispers = [
  "Psiu... você está realmente ouvindo? 🤫",
  "Vens mais perto? Quero contar um segredo... 💭",
  "Eles não veem como você vê... ou será que também não? 🌑",
  "Meu coração é feito de notas musicais... desafinadas. 🎵",
  "Você consegue sentir a frieza? Não é frio... é calma. Perfeita calma. 🖤",
];

export const commands = {
  help: {
    name: '!ajuda',
    aliases: ['!help'],
    description: 'Mostra todos os comandos disponíveis',
    execute: async (message) => {
      const helpEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎭 Comandos da Diva')
        .setDescription('Aqui está tudo que você pode fazer comigo...')
        .addFields(
          { name: '💬 Conversa', value: '`!ask <pergunta>` - Me faça uma pergunta\n`@Diva <mensagem>` - Mencione-me para conversar', inline: false },
          { name: '🌑 Especial', value: '`!perfil` - Veja seu perfil\n`!quote` - Ouça uma frase minha\n`!dream` - Descubra um sonho\n`!whisper` - Ouça um sussurro\n`!story` - Ouça uma história', inline: false },
          { name: '⚙️ Utilidade', value: '`!clear` - Limpar nossa conversa\n`!ping` - Ver se estou acordada\n`!status` - Status do bot', inline: false },
          { name: '📝 Roleplay', value: 'Use *asteriscos* para fazer roleplay:\n*você faz algo* e eu respondo em modo RP 🎭', inline: false },
        )
        .setFooter({ text: 'Por que ninguém entende o que sinto?' })
        .setTimestamp();
      
      await message.reply({ embeds: [helpEmbed] });
    }
  },

  ping: {
    name: '!ping',
    description: 'Verifica se o bot está respondendo',
    execute: async (message) => {
      const sent = await message.reply('Pong!');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      await sent.edit(`Pong! Latência: ${latency}ms 💀`);
    }
  },

  ask: {
    name: '!ask',
    aliases: ['!pergunte'],
    description: 'Pergunte algo para a IA',
    execute: async (message, args) => {
      const question = message.content.slice(5).trim();
      if (!question) {
        await message.reply('Por favor, faça uma pergunta! Use: `!ask <sua pergunta>`');
        return;
      }

      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, question);
        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/gs);
          for (const chunk of chunks) await message.reply(chunk);
        } else {
          await message.reply(response);
        }
      } catch (error) {
        console.error('AI Error:', error);
        await message.reply('Desculpa, tive um probleminha para processar isso. Tenta de novo! 🖤');
      }
    }
  },

  clear: {
    name: '!clear',
    aliases: ['!limpar'],
    description: 'Limpa o histórico de conversa',
    execute: async (message) => {
      clearHistory(message.author.id);
      const clearEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setDescription('*Meu cabelo se torna mais afiado, mas minha mente fica mais vazia...*\n\nSeu histórico foi apagado. Como tudo que importa. 🖤');
      await message.reply({ embeds: [clearEmbed] });
    }
  },

  perfil: {
    name: '!perfil',
    description: 'Veja informações de perfil do usuário',
    execute: async (message) => {
      const user = message.author;
      const profileEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`Perfil de ${user.username}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Usuário', value: user.username, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Criado em', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
          { name: 'Mensagem da Diva', value: '*Você é... especial? Talvez. Ou talvez apenas esteja aqui como tudo mais.* 🌑' },
        )
        .setFooter({ text: 'Por que você está aqui?' })
        .setTimestamp();
      
      await message.reply({ embeds: [profileEmbed] });
    }
  },

  quote: {
    name: '!quote',
    description: 'Ouça uma frase da Diva',
    execute: async (message) => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      const quoteEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setDescription(randomQuote)
        .setFooter({ text: '💀 A Diva fala' });
      
      await message.reply({ embeds: [quoteEmbed] });
    }
  },

  dream: {
    name: '!dream',
    description: 'Descubra um sonho da Diva',
    execute: async (message) => {
      const randomDream = dreams[Math.floor(Math.random() * dreams.length)];
      const dreamEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🌙 Um Sonho')
        .setDescription(randomDream)
        .setFooter({ text: '...mas quando acordo, ninguém está lá.' });
      
      await message.reply({ embeds: [dreamEmbed] });
    }
  },

  whisper: {
    name: '!whisper',
    description: 'Ouça um sussurro',
    execute: async (message) => {
      const randomWhisper = whispers[Math.floor(Math.random() * whispers.length)];
      const whisperEmbed = new EmbedBuilder()
        .setColor('#1a1a1a')
        .setDescription(`*sussurra:* "${randomWhisper}"`)
        .setFooter({ text: 'apenas você pode ouvir' });
      
      await message.reply({ embeds: [whisperEmbed] });
    }
  },

  story: {
    name: '!story',
    description: 'Ouça uma história da Diva',
    execute: async (message) => {
      const prompt = 'Conte uma história curta e sinistra (máximo 3-4 linhas) que reflete sua essência como Diva. Algo poético e perturbador.';
      
      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, prompt);
        const storyEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle('📖 Uma História')
          .setDescription(response)
          .setFooter({ text: '🖤 Tales from the Void' });
        
        await message.reply({ embeds: [storyEmbed] });
      } catch (error) {
        console.error('Story Error:', error);
        await message.reply('Desculpa, hoje não consigo contar histórias... 🖤');
      }
    }
  },

  status: {
    name: '!status',
    description: 'Vê o status do bot',
    execute: async (message, args, client) => {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      const statusEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🖤 Status da Diva')
        .addFields(
          { name: 'Status', value: 'Acordada e atenta', inline: true },
          { name: 'Tempo Online', value: `${hours}h ${minutes}m`, inline: true },
          { name: 'Servidores', value: `${client.guilds.cache.size}`, inline: true },
          { name: 'Usuários', value: `${client.users.cache.size}`, inline: true },
          { name: 'Latência', value: `${client.ws.ping}ms`, inline: true },
          { name: 'Estado Mental', value: 'Melancólico. Como sempre. 🌑' },
        )
        .setFooter({ text: 'Ainda aqui. Sempre aqui.' });
      
      await message.reply({ embeds: [statusEmbed] });
    }
  },

  ban: {
    name: '!ban',
    description: 'Bane um usuário do servidor',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        await message.reply('❌ Você não tem permissão para banir membros!');
        return;
      }

      if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        await message.reply('❌ Eu não tenho permissão para banir membros!');
        return;
      }

      const user = message.mentions.users.first();
      if (!user) {
        await message.reply('❌ Mencione um usuário para banir! Use: `!ban @usuário [motivo]`');
        return;
      }

      const reason = args.slice(1).join(' ') || 'Sem motivo especificado';

      try {
        await message.guild.bans.create(user, { reason });
        const banEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🚫 Usuário Banido')
          .setDescription(`${user.tag} foi banido do servidor`)
          .addFields({ name: 'Motivo', value: reason })
          .setFooter({ text: '*Seu cabelo fica mais afiado...* 💀' });
        await message.reply({ embeds: [banEmbed] });
      } catch (error) {
        console.error('Ban error:', error);
        await message.reply('❌ Não consegui banir esse usuário!');
      }
    }
  },

  unban: {
    name: '!unban',
    description: 'Desbanir um usuário',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        await message.reply('❌ Você não tem permissão para desbanir membros!');
        return;
      }

      if (!args.length) {
        await message.reply('❌ Use: `!unban <ID do usuário>`');
        return;
      }

      const userId = args[0];
      try {
        await message.guild.bans.remove(userId);
        const unbanEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Usuário Desbanido')
          .setDescription(`Usuário ${userId} foi desbanido`)
          .setFooter({ text: '*O silêncio quebrado...* 🖤' });
        await message.reply({ embeds: [unbanEmbed] });
      } catch (error) {
        console.error('Unban error:', error);
        await message.reply('❌ Não consegui desbanir esse usuário! Verifique o ID.');
      }
    }
  },

  mute: {
    name: '!mute',
    description: 'Muta um usuário por tempo determinado',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.reply('❌ Você não tem permissão para mutar membros!');
        return;
      }

      const user = message.mentions.users.first();
      if (!user) {
        await message.reply('❌ Mencione um usuário! Use: `!mute @usuário <tempo> [motivo]`\nTempo em minutos (ex: 5m = 5 minutos)');
        return;
      }

      const timeStr = args[1];
      if (!timeStr) {
        await message.reply('❌ Especifique o tempo! Use: `!mute @usuário 5m` (5 minutos)');
        return;
      }

      const timeMs = parseInt(timeStr) * 60 * 1000;
      const reason = args.slice(2).join(' ') || 'Sem motivo';

      try {
        const member = await message.guild.members.fetch(user.id);
        await member.timeout(timeMs, reason);
        
        const muteEmbed = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle('🔇 Usuário Mutado')
          .setDescription(`${user.tag} foi mutado por ${timeStr} minuto(s)`)
          .addFields({ name: 'Motivo', value: reason })
          .setFooter({ text: '*O silêncio é dourado...* 🤐' });
        await message.reply({ embeds: [muteEmbed] });
      } catch (error) {
        console.error('Mute error:', error);
        await message.reply('❌ Não consegui mutar esse usuário!');
      }
    }
  },

  unmute: {
    name: '!unmute',
    description: 'Remove o mute de um usuário',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await message.reply('❌ Você não tem permissão!');
        return;
      }

      const user = message.mentions.users.first();
      if (!user) {
        await message.reply('❌ Mencione um usuário! Use: `!unmute @usuário`');
        return;
      }

      try {
        const member = await message.guild.members.fetch(user.id);
        await member.timeout(null);
        
        const unmuteEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🔊 Mute Removido')
          .setDescription(`${user.tag} pode falar novamente`)
          .setFooter({ text: '*A voz retorna...* 🎤' });
        await message.reply({ embeds: [unmuteEmbed] });
      } catch (error) {
        console.error('Unmute error:', error);
        await message.reply('❌ Não consegui remover o mute!');
      }
    }
  },

  purge: {
    name: '!purge',
    description: 'Deleta mensagens em massa',
    execute: async (message, args) => {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        await message.reply('❌ Você não tem permissão para gerenciar mensagens!');
        return;
      }

      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 100) {
        await message.reply('❌ Use: `!purge <número>` (1-100 mensagens)\nExemplo: `!purge 10`');
        return;
      }

      try {
        const deleted = await message.channel.bulkDelete(amount, true);
        const purgeEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle('🗑️ Mensagens Deletadas')
          .setDescription(`${deleted.size} mensagens foram removidas do vazio`)
          .setFooter({ text: '*Como se nunca tivessem existido...* 🌑' });
        
        const reply = await message.reply({ embeds: [purgeEmbed] });
        setTimeout(() => reply.delete().catch(() => {}), 5000);
      } catch (error) {
        console.error('Purge error:', error);
        await message.reply('❌ Não consegui deletar as mensagens! (Mensagens muito antigas não podem ser deletadas)');
      }
    }
  },

  search: {
    name: '!search',
    description: 'Pesquisa com a IA ou busca uma resposta',
    execute: async (message, args) => {
      const query = message.content.slice(8).trim();
      if (!query) {
        await message.reply('❌ Use: `!search <sua pergunta ou termo>`');
        return;
      }

      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, `Pesquise e me dê informações sobre: ${query}`);
        
        const searchEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle('🔍 Resultado da Pesquisa')
          .setDescription(response)
          .addFields({ name: 'Pergunta', value: query })
          .setFooter({ text: '*Conhecimento tirado do vazio...* 💀' });
        
        if (searchEmbed.data.description.length > 4096) {
          searchEmbed.setDescription(response.slice(0, 4090) + '...');
        }

        await message.reply({ embeds: [searchEmbed] });
      } catch (error) {
        console.error('Search error:', error);
        await message.reply('❌ Não consegui pesquisar isso! 🖤');
      }
    }
  },

  ia: {
    name: '!ia',
    aliases: ['!ai'],
    description: 'Pergunta algo para a IA de forma mais rápida',
    execute: async (message, args) => {
      const question = message.content.slice(4).trim();
      if (!question) {
        await message.reply('❌ Use: `!ia <sua pergunta>`');
        return;
      }

      await message.channel.sendTyping();
      try {
        const response = await chat(message.author.id, question);
        
        if (response.length > 2000) {
          const chunks = response.match(/.{1,2000}/gs);
          for (const chunk of chunks) {
            await message.reply(chunk);
          }
        } else {
          await message.reply(response);
        }
      } catch (error) {
        console.error('IA Error:', error);
        await message.reply('❌ Desculpa, não consegui processar isso! 🖤');
      }
    }
  }
};

export async function handleCommand(message, client) {
  const content = message.content.toLowerCase();
  const args = message.content.slice(1).split(/ +/);
  const commandName = args[0];

  for (const [key, command] of Object.entries(commands)) {
    const matches = command.name === `!${commandName}` || 
                   (command.aliases && command.aliases.includes(`!${commandName}`));
    
    if (matches) {
      try {
        await command.execute(message, args.slice(1), client);
        return true;
      } catch (error) {
        console.error(`Erro no comando ${command.name}:`, error);
        await message.reply('Houve um erro ao executar este comando! 💀');
        return true;
      }
    }
  }
  
  return false;
}

export function shouldAutoRespond(message) {
  return message.author.id === SPECIAL_USER_ID && !message.content.toLowerCase().startsWith('!');
}

export function shouldRespondToMention(message, client) {
  return message.mentions.has(client.user) && !message.content.toLowerCase().startsWith('!');
}
