
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const TICKETS_FILE = path.join(process.cwd(), 'data', 'tickets.json');

// Estrutura de dados dos tickets
let ticketsData = {
  tickets: {}, // { ticketId: { userId, channelId, status, createdAt, closedAt } }
  config: {
    categoryId: null, // Categoria onde os tickets serão criados
    supportRoleId: null, // Cargo de suporte
    ticketCounter: 0
  }
};

// Carregar dados
export function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
      ticketsData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar tickets:', error);
  }
}

// Salvar dados
function saveTickets() {
  try {
    const dir = path.dirname(TICKETS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(ticketsData, null, 2));
  } catch (error) {
    console.error('Erro ao salvar tickets:', error);
  }
}

// Verificar se usuário é administrador do Discord
export function isDiscordAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

// Configurar categoria de tickets
export function setTicketCategory(guildId, categoryId) {
  ticketsData.config.categoryId = categoryId;
  saveTickets();
  return true;
}

// Configurar cargo de suporte
export function setSupportRole(guildId, roleId) {
  ticketsData.config.supportRoleId = roleId;
  saveTickets();
  return true;
}

// Criar ticket
export async function createTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  // Verificar se usuário já tem ticket aberto
  const existingTicket = Object.values(ticketsData.tickets).find(
    t => t.userId === user.id && t.status === 'open'
  );

  if (existingTicket) {
    await interaction.reply({
      content: `❌ Você já tem um ticket aberto: <#${existingTicket.channelId}>`,
      ephemeral: true
    });
    return;
  }

  ticketsData.config.ticketCounter++;
  const ticketNumber = ticketsData.config.ticketCounter;
  const ticketId = `ticket-${ticketNumber}`;

  try {
    // Criar canal de ticket
    const ticketChannel = await guild.channels.create({
      name: `🎫┃${ticketId}`,
      type: ChannelType.GuildText,
      parent: ticketsData.config.categoryId || undefined,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels
          ]
        }
      ]
    });

    // Se houver cargo de suporte, adicionar permissões
    if (ticketsData.config.supportRoleId) {
      await ticketChannel.permissionOverwrites.create(ticketsData.config.supportRoleId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
    }

    // Salvar ticket
    ticketsData.tickets[ticketId] = {
      userId: user.id,
      channelId: ticketChannel.id,
      status: 'open',
      createdAt: new Date().toISOString(),
      closedAt: null
    };
    saveTickets();

    // Criar embed de boas-vindas
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00bfff')
      .setTitle(`🎫 Ticket #${ticketNumber}`)
      .setDescription(`Olá ${user}! Bem-vindo ao seu ticket de suporte.\n\nDescreva seu problema ou dúvida e a equipe de suporte responderá em breve.\n\n*Para fechar este ticket, clique no botão abaixo.* 🖤`)
      .addFields(
        { name: '👤 Criado por', value: `${user.tag}`, inline: true },
        { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        { name: '🆔 ID do Ticket', value: ticketId, inline: true }
      )
      .setFooter({ text: 'Sistema de Tickets | Diva Bot' })
      .setTimestamp();

    // Botões de controle
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketId}`)
          .setLabel('🔒 Fechar Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`claim_ticket_${ticketId}`)
          .setLabel('📌 Assumir Ticket')
          .setStyle(ButtonStyle.Primary)
      );

    await ticketChannel.send({ embeds: [welcomeEmbed], components: [row] });

    // Responder ao usuário
    await interaction.reply({
      content: `✅ Ticket criado com sucesso! Acesse: ${ticketChannel}`,
      ephemeral: true
    });

    // Notificar suporte se configurado
    if (ticketsData.config.supportRoleId) {
      await ticketChannel.send(`<@&${ticketsData.config.supportRoleId}> Novo ticket criado!`);
    }

  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    await interaction.reply({
      content: '❌ Erro ao criar ticket! Verifique as permissões do bot.',
      ephemeral: true
    });
  }
}

// Fechar ticket
export async function closeTicket(interaction, ticketId) {
  const ticket = ticketsData.tickets[ticketId];

  if (!ticket) {
    await interaction.reply({
      content: '❌ Ticket não encontrado!',
      ephemeral: true
    });
    return;
  }

  if (ticket.status === 'closed') {
    await interaction.reply({
      content: '❌ Este ticket já está fechado!',
      ephemeral: true
    });
    return;
  }

  // Verificar se é o dono do ticket, admin do Discord ou suporte
  const isOwner = ticket.userId === interaction.user.id;
  const isAdmin = isDiscordAdmin(interaction.member);
  const hasSupport = ticketsData.config.supportRoleId && 
                     interaction.member.roles.cache.has(ticketsData.config.supportRoleId);

  if (!isOwner && !isAdmin && !hasSupport) {
    await interaction.reply({
      content: '❌ Você não tem permissão para fechar este ticket!',
      ephemeral: true
    });
    return;
  }

  const channel = interaction.channel;

  // Criar transcript (log básico)
  const closeEmbed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('🔒 Ticket Fechado')
    .setDescription(`Ticket fechado por ${interaction.user}`)
    .addFields(
      { name: '📅 Fechado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: '👤 Criado por', value: `<@${ticket.userId}>`, inline: true }
    )
    .setFooter({ text: 'O canal será deletado em 10 segundos...' })
    .setTimestamp();

  await interaction.reply({ embeds: [closeEmbed] });

  // Atualizar status
  ticket.status = 'closed';
  ticket.closedAt = new Date().toISOString();
  ticket.closedBy = interaction.user.id;
  saveTickets();

  // Deletar canal após 10 segundos
  setTimeout(async () => {
    try {
      await channel.delete();
    } catch (error) {
      console.error('Erro ao deletar canal:', error);
    }
  }, 10000);
}

// Assumir ticket
export async function claimTicket(interaction, ticketId) {
  const ticket = ticketsData.tickets[ticketId];

  if (!ticket) {
    await interaction.reply({
      content: '❌ Ticket não encontrado!',
      ephemeral: true
    });
    return;
  }

  // Verificar se é admin do Discord ou tem cargo de suporte
  const isAdmin = isDiscordAdmin(interaction.member);
  const hasSupport = ticketsData.config.supportRoleId && 
                     interaction.member.roles.cache.has(ticketsData.config.supportRoleId);

  if (!isAdmin && !hasSupport) {
    await interaction.reply({
      content: '❌ Você não tem permissão para assumir tickets! Apenas administradores ou suporte.',
      ephemeral: true
    });
    return;
  }

  if (ticket.claimedBy) {
    await interaction.reply({
      content: `❌ Este ticket já foi assumido por <@${ticket.claimedBy}>`,
      ephemeral: true
    });
    return;
  }

  ticket.claimedBy = interaction.user.id;
  ticket.claimedAt = new Date().toISOString();
  saveTickets();

  const claimEmbed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('📌 Ticket Assumido')
    .setDescription(`${interaction.user} assumiu este ticket e irá atendê-lo!`)
    .setTimestamp();

  await interaction.reply({ embeds: [claimEmbed] });
}

// Obter estatísticas de tickets
export function getTicketStats() {
  const allTickets = Object.values(ticketsData.tickets);
  const openTickets = allTickets.filter(t => t.status === 'open').length;
  const closedTickets = allTickets.filter(t => t.status === 'closed').length;
  const totalTickets = allTickets.length;

  return {
    open: openTickets,
    closed: closedTickets,
    total: totalTickets
  };
}

// Enviar painel de tickets
export async function sendTicketPanel(channel) {
  const panelEmbed = new EmbedBuilder()
    .setColor('#00bfff')
    .setTitle('🎫 Sistema de Tickets')
    .setDescription('Precisa de ajuda? Clique no botão abaixo para abrir um ticket de suporte!\n\nNossa equipe responderá assim que possível.\n\n*Cada usuário pode ter apenas 1 ticket aberto por vez.* 🖤')
    .addFields(
      { name: '📋 Como funciona?', value: '1️⃣ Clique em "Abrir Ticket"\n2️⃣ Um canal privado será criado\n3️⃣ Descreva seu problema\n4️⃣ Aguarde atendimento', inline: false }
    )
    .setFooter({ text: 'Sistema de Tickets | Diva Bot' })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('🎫 Abrir Ticket')
        .setStyle(ButtonStyle.Success)
    );

  await channel.send({ embeds: [panelEmbed], components: [row] });
}

// Inicializar
loadTickets();
