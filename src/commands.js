import { chat, clearHistory } from './gemini.js';
import { EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import { getBalance, addBalance, removeBalance, transfer, dailyReward, getLeaderboard, work, gamble } from './economy.js';
import { getUserInfo, getXPLeaderboard, getUserRank } from './xp.js';
import { setAFK, removeAFK, isAFK } from './afk.js';
import { executeRP } from './rpCommands.js';
import { generateProfileCard } from './profileCard.js';

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
      const xpInfo = getUserInfo(message.author.id);
      const rank = getUserRank(message.author.id);
      const balance = getBalance(message.author.id);
      
      try {
        // Gerar card visual
        const cardImage = await generateProfileCard({
          username: user.username,
          avatarURL: user.displayAvatarURL({ extension: 'png', size: 512 }),
          level: xpInfo.level,
          xp: xpInfo.xp,
          xpNeeded: xpInfo.xpNeeded,
          balance: balance
        });

        if (cardImage) {
          // Enviar a imagem como attachment
          const attachment = new AttachmentBuilder(cardImage, { name: 'perfil.png' });
          
          const profileEmbed = new EmbedBuilder()
            .setColor('#0a0a0a')
            .setTitle(`🖤 ${user.username}`)
            .addFields(
              { name: '📊 Nível', value: `**${xpInfo.level}**`, inline: true },
              { name: '📈 Rank XP', value: `**#${rank}**`, inline: true },
              { name: '⭐ Rank Global', value: `**#${rank}**`, inline: true },
              { name: 'XP Atual', value: `${xpInfo.xp} / ${xpInfo.xpNeeded}`, inline: false },
              { name: 'Progresso', value: xpInfo.progressBar, inline: false },
              { name: '💰 Akita Neru', value: `**${balance}**`, inline: true },
              { name: '📅 Membro desde', value: user.createdAt.toLocaleDateString('pt-BR'), inline: true },
              { name: '🎭 Mensagem da Diva', value: '*Você é... especial? Talvez. Ou talvez apenas esteja aqui como tudo mais.* 🌑' }
            )
            .setImage('attachment://perfil.png')
            .setFooter({ text: 'Por que você está aqui?' })
            .setTimestamp();
          
          await message.reply({ embeds: [profileEmbed], files: [attachment] });
        } else {
          throw new Error('Falha ao gerar card');
        }
      } catch (error) {
        console.error('Profile card error:', error);
        // Fallback para embed simples
        const profileEmbed = new EmbedBuilder()
          .setColor('#0a0a0a')
          .setTitle(`🖤 ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: '📊 Nível', value: `**${xpInfo.level}**`, inline: true },
            { name: '📈 Rank XP', value: `**#${rank}**`, inline: true },
            { name: '⭐ Rank Global', value: `**#${rank}**`, inline: true },
            { name: 'XP Atual', value: `${xpInfo.xp} / ${xpInfo.xpNeeded}`, inline: false },
            { name: 'Progresso', value: xpInfo.progressBar, inline: false },
            { name: '💰 Akita Neru', value: `**${balance}**`, inline: true }
          )
          .setFooter({ text: 'Por que você está aqui?' });
        
        await message.reply({ embeds: [profileEmbed] });
      }
    }
  },

  topxp: {
    name: '!topxp',
    aliases: ['!rankxp', '!xptop'],
    description: 'Veja o ranking de XP do servidor',
    execute: async (message, args, client) => {
      const leaderboard = getXPLeaderboard(10);
      
      let description = '**TOP 10 - Ranking de XP**\n\n';
      for (let i = 0; i < leaderboard.length; i++) {
        try {
          const user = await client.users.fetch(leaderboard[i].userId);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}️⃣`;
          description += `${medal} **${user.username}** - Nível ${leaderboard[i].level} | ${leaderboard[i].totalXP} XP\n`;
        } catch {
          description += `${i + 1}️⃣ Usuário desconhecido - Nível ${leaderboard[i].level} | ${leaderboard[i].totalXP} XP\n`;
        }
      }

      const topxpEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🌟 Ranking de XP')
        .setDescription(description)
        .setFooter({ text: '*Mas o que significa força neste vazio?* 🖤' });
      
      await message.reply({ embeds: [topxpEmbed] });
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
  },

  comandos: {
    name: '!comandos',
    aliases: ['!commands', '!cmds'],
    description: 'Mostra todos os comandos disponíveis',
    execute: async (message) => {
      // Embed 1: Conversa & Utilidade
      const embed1 = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎭 Comandos da Diva - Parte 1')
        .addFields(
          { name: '💬 Conversa & IA', value: '`!ask <pergunta>` - Pergunte algo\n`!ia <pergunta>` - Atalho rápido\n`!search <termo>` - Pesquisar', inline: false },
          { name: '✨ Especial', value: '`!quote` - Frase aleatória\n`!dream` - Sonho da Diva\n`!whisper` - Sussurro misterioso\n`!story` - Uma história', inline: false },
          { name: '🎲 Aleatório', value: '`!sorte` - Sua sorte do dia\n`!carta` - Tire uma carta de tarô\n`!rng <min> <max>` - Número aleatório\n`!dado` - Jogue um dado', inline: false },
          { name: '⚙️ Utilidade', value: '`!ping` - Latência\n`!status` - Status do bot\n`!clear` - Limpar chat\n`!afk <motivo>` - Marque-se como AFK', inline: false }
        )
        .setFooter({ text: 'Página 1 de 4 - Use !comandos para ver mais' });

      // Embed 2: Moderação
      const embed2 = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🔨 Comandos da Diva - Moderação')
        .addFields(
          { name: '⚖️ Controle', value: '`!ban @usuário` - Banir\n`!unban <ID>` - Desbanir\n`!mute @usuário <tempo>` - Mutar\n`!unmute @usuário` - Desmutar\n`!purge <número>` - Deletar mensagens', inline: false }
        )
        .setFooter({ text: 'Página 2 de 4 - Requer permissões' });

      // Embed 3: Economia & XP
      const embed3 = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('💰 Comandos da Diva - Economia (Akita Neru)')
        .addFields(
          { name: '💵 Moeda', value: '`!balance` - Ver saldo\n`!daily` - Ganhar 50/dia\n`!work` - Ganhar 10-40\n`!transfer @usuário <qty>` - Enviar\n`!gamble <qty>` - Apostar 50/50\n`!top` - Ranking', inline: false }
        )
        .setFooter({ text: 'Página 3 de 4' });

      // Embed 4: XP & Perfil
      const embed4 = new EmbedBuilder()
        .setColor('#00ffff')
        .setTitle('⭐ Comandos da Diva - XP & Perfil')
        .addFields(
          { name: '🌟 Sistema de XP', value: 'Ganhe 10 XP por mensagem!\nReceba notificação privada ao subir de nível 🖤', inline: false },
          { name: '📊 Comandos', value: '`!perfil` - Gera card visual com suas info!\n`!topxp` - Ranking de XP do servidor\n`!rankxp` - Alternativa para !topxp', inline: false },
          { name: '😴 AFK', value: '`!afk <motivo>` - Fique AFK\nRecebirá DM se alguém mencionar você 🌑', inline: false },
          { name: '💕 Roleplay', value: '`!tapa` `!beijo` `!abraço` `!casar` `!divorciar` `!dança` - Com gifs! 🎭', inline: false }
        )
        .setFooter({ text: 'Página 4 de 4 - Use / para slash commands!' });

      await message.reply({ embeds: [embed1, embed2, embed3, embed4] });
    }
  },

  balance: {
    name: '!balance',
    aliases: ['!saldo', '!money'],
    description: 'Veja seu saldo em Akita Neru',
    execute: async (message) => {
      const balance = getBalance(message.author.id);
      const balanceEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('💰 Seu Saldo')
        .setThumbnail(message.author.displayAvatarURL())
        .setDescription(`**${balance} Akita Neru**`)
        .setFooter({ text: '*Porcelana vale mais do que ouro...* 🖤' });
      
      await message.reply({ embeds: [balanceEmbed] });
    }
  },

  daily: {
    name: '!daily',
    aliases: ['!diario'],
    description: 'Receba sua recompensa diária (50 Akita Neru)',
    execute: async (message) => {
      const reward = dailyReward(message.author.id);
      
      if (!reward) {
        const dailyEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('❌ Prematuro')
          .setDescription('Você já coletou sua recompensa diária!\nVolte amanhã... ou talvez nunca. 🌑');
        await message.reply({ embeds: [dailyEmbed] });
        return;
      }

      const dailyEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('✨ Recompensa Diária!')
        .setDescription(`Você ganhou **${reward} Akita Neru**!\n\n*Você compreendeu como obter valor aqui...* 💀`)
        .setFooter({ text: `Seu novo saldo: ${getBalance(message.author.id)} Akita Neru` });
      
      await message.reply({ embeds: [dailyEmbed] });
    }
  },

  transfer: {
    name: '!transfer',
    aliases: ['!enviar', '!pagar'],
    description: 'Transferir Akita Neru para outro usuário',
    execute: async (message, args) => {
      const user = message.mentions.users.first();
      const amount = parseInt(args[1]);

      if (!user || !amount || amount <= 0) {
        await message.reply('❌ Use: `!transfer @usuário <quantidade>`');
        return;
      }

      const result = transfer(message.author.id, user.id, amount);

      if (!result) {
        await message.reply('❌ Você não tem Akita Neru suficiente!');
        return;
      }

      const transferEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('💸 Transferência Realizada')
        .setDescription(`Você enviou **${amount} Akita Neru** para ${user.tag}`)
        .addFields(
          { name: 'Seu novo saldo', value: `${result.fromBalance} Akita Neru`, inline: true },
          { name: 'Saldo do receptor', value: `${result.toBalance} Akita Neru`, inline: true }
        )
        .setFooter({ text: '*Generosidade... ou pena?* 🖤' });
      
      await message.reply({ embeds: [transferEmbed] });
    }
  },

  work: {
    name: '!work',
    aliases: ['!trabalhar'],
    description: 'Trabalhe e ganhe Akita Neru (10-40)',
    execute: async (message) => {
      const earnings = work(message.author.id);
      const workEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('💼 Você Trabalhou')
        .setDescription(`Você ganhou **${earnings} Akita Neru**!\n\n*Porcelana quebrada ainda pode produzir algo...* 🖤`)
        .setFooter({ text: `Novo saldo: ${getBalance(message.author.id)} Akita Neru` });
      
      await message.reply({ embeds: [workEmbed] });
    }
  },

  top: {
    name: '!top',
    aliases: ['!rank', '!leaderboard'],
    description: 'Veja o ranking de Akita Neru',
    execute: async (message, args, client) => {
      const leaderboard = getLeaderboard(10);
      
      let description = '**TOP 10 - Ranking de Akita Neru**\n\n';
      for (let i = 0; i < leaderboard.length; i++) {
        try {
          const user = await client.users.fetch(leaderboard[i].userId);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}️⃣`;
          description += `${medal} **${user.username}** - ${leaderboard[i].balance} Akita Neru\n`;
        } catch {
          description += `${i + 1}️⃣ Usuário desconhecido - ${leaderboard[i].balance} Akita Neru\n`;
        }
      }

      const topEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🏆 Ranking de Riqueza')
        .setDescription(description)
        .setFooter({ text: '*Mas o que significa riqueza neste vazio?* 🖤' });
      
      await message.reply({ embeds: [topEmbed] });
    }
  },

  gamble: {
    name: '!gamble',
    aliases: ['!aposta'],
    description: 'Aposte Akita Neru em uma chance 50/50',
    execute: async (message, args) => {
      const amount = parseInt(args[0]);

      if (!amount || amount <= 0) {
        await message.reply('❌ Use: `!gamble <quantidade>`');
        return;
      }

      const result = gamble(message.author.id, amount);

      if (!result) {
        await message.reply('❌ Você não tem Akita Neru suficiente!');
        return;
      }

      if (result.won) {
        const gamblesEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('🎲 Você Ganhou!')
          .setDescription(`Você dobrou sua aposta!\n\n**+${result.earnings} Akita Neru**`)
          .setFooter({ text: `Novo saldo: ${result.newBalance} Akita Neru - *Sorte... ou destino?* 🖤` });
        await message.reply({ embeds: [gamblesEmbed] });
      } else {
        const gamblesEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🎲 Você Perdeu...')
          .setDescription(`Sua aposta desapareceu.\n\n**-${result.loss} Akita Neru**`)
          .setFooter({ text: `Novo saldo: ${result.newBalance} Akita Neru - *Como tudo que importa...* 🖤` });
        await message.reply({ embeds: [gamblesEmbed] });
      }
    }
  },

  afk: {
    name: '!afk',
    description: 'Marque-se como AFK com um motivo',
    execute: async (message, args, client) => {
      const reason = message.content.slice(5).trim() || 'Sem motivo';
      setAFK(message.author.id, reason);
      
      try {
        const member = await message.guild.members.fetch(message.author.id);
        const newName = `[AFK] ${member.user.username}`;
        await member.setNickname(newName);
      } catch (error) {
        console.error('Erro ao mudar nick para AFK:', error);
      }

      const afkEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('😴 Você está AFK')
        .setDescription(`**Motivo:** ${reason}`)
        .setFooter({ text: '*Você desapareceu no vazio...* 🌑' });
      
      await message.reply({ embeds: [afkEmbed] });
    }
  },

  tapa: {
    name: '!tapa',
    aliases: ['!slap'],
    description: 'Dê um tapa em alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'tapa', targetUser);
    }
  },

  beijo: {
    name: '!beijo',
    aliases: ['!kiss'],
    description: 'Beije alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'beijo', targetUser);
    }
  },

  abraco: {
    name: '!abraco',
    aliases: ['!hug'],
    description: 'Abrace alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'abraco', targetUser);
    }
  },

  casar: {
    name: '!casar',
    aliases: ['!marry'],
    description: 'Case com alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'casar', targetUser);
    }
  },

  divorciar: {
    name: '!divorciar',
    aliases: ['!divorce'],
    description: 'Divorce de alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'divorciar', targetUser);
    }
  },

  danca: {
    name: '!danca',
    aliases: ['!dance'],
    description: 'Dance com alguém',
    execute: async (message) => {
      const targetUser = message.mentions.users.first();
      await executeRP(message, 'danca', targetUser);
    }
  },

  sorte: {
    name: '!sorte',
    aliases: ['!luck', '!fortune'],
    description: 'Descubra sua sorte do dia',
    execute: async (message) => {
      const fortunes = [
        '🎴 Fortuna te sorri hoje... ou talvez apenas fingir.',
        '💀 Seu destino está escrito em tinta invisível.',
        '🖤 A sorte é uma ilusão, mas você ainda assim acredita.',
        '✨ Algo bom acontecerá... para alguém. Talvez não você.',
        '🌑 O universo sussurra seu nome. Mas sem esperança.',
        '💭 Sua sorte muda a cada respiração que dou.',
        '🎭 O acaso é meu aliado. Sempre foi.',
        '🦑 Você será abençoado, mas com o ônus da compreensão.',
      ];
      const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];
      const fortuneEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎴 Sua Sorte')
        .setDescription(fortune)
        .setFooter({ text: 'O destino é apenas uma desculpa...' });
      await message.reply({ embeds: [fortuneEmbed] });
    }
  },

  carta: {
    name: '!carta',
    aliases: ['!tarot', '!tarô'],
    description: 'Tire uma carta do tarô',
    execute: async (message) => {
      const cards = [
        { name: 'O Louco', emoji: '🃏', desc: 'Mudança, liberdade... ou loucura?' },
        { name: 'O Mágico', emoji: '✨', desc: 'Poder e ilusão andam de mãos dadas.' },
        { name: 'A Alta Sacerdotisa', emoji: '🌙', desc: 'Mistérios guardados no silêncio.' },
        { name: 'A Imperatriz', emoji: '👑', desc: 'Criação e destruição são gêmeas.' },
        { name: 'O Imperador', emoji: '♚', desc: 'Domínio absoluto, mas sem satisfação.' },
        { name: 'O Eremita', emoji: '🕯️', desc: 'Solidão é a verdade mais pura.' },
        { name: 'A Morte', emoji: '💀', desc: 'Fim e recomeço; você escolhe qual.' },
        { name: 'O Diabo', emoji: '👿', desc: 'Escravidão é apenas conforto.' },
        { name: 'A Torre', emoji: '🗼', desc: 'Tudo que sobe deve desabar.' },
        { name: 'A Lua', emoji: '🌑', desc: 'Entre a verdade e o engano há meu rosto.' },
        { name: 'O Mundo', emoji: '🌍', desc: 'Fim, mas sem encerramento verdadeiro.' },
        { name: 'O Enforcado', emoji: '🪢', desc: 'Perspectiva diferente através do sofrimento.' },
      ];
      const card = cards[Math.floor(Math.random() * cards.length)];
      const cardEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle(`${card.emoji} ${card.name}`)
        .setDescription(card.desc)
        .setFooter({ text: 'O destino fala através das cartas...' });
      await message.reply({ embeds: [cardEmbed] });
    }
  },

  rng: {
    name: '!rng',
    aliases: ['!random', '!rand'],
    description: 'Número aleatório entre min e max',
    execute: async (message, args) => {
      const min = parseInt(args[0]) || 1;
      const max = parseInt(args[1]) || 100;
      
      if (isNaN(min) || isNaN(max)) {
        await message.reply('❌ Use: `!rng <min> <max>`');
        return;
      }
      
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      const rngEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎲 Número Aleatório')
        .setDescription(`**${num}**`)
        .addFields(
          { name: 'Intervalo', value: `${min} - ${max}`, inline: true }
        )
        .setFooter({ text: 'O acaso dorme em meus olhos...' });
      await message.reply({ embeds: [rngEmbed] });
    }
  },

  dado: {
    name: '!dado',
    aliases: ['!dice', '!roll'],
    description: 'Jogue um dado (1-6)',
    execute: async (message) => {
      const result = Math.floor(Math.random() * 6) + 1;
      const diceEmbed = new EmbedBuilder()
        .setColor('#0a0a0a')
        .setTitle('🎲 Resultado do Dado')
        .setDescription(`**${result}**`)
        .setFooter({ text: 'Sorte e desventura são uma coisa só...' });
      await message.reply({ embeds: [diceEmbed] });
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
