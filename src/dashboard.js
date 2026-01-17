
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllUsers as getEconomyUsers, getBalance, addBalance, removeBalance } from './economy.js';
import { getAllUsers as getXPUsers, getUserInfo } from './xp.js';
import { getAdmins, isAdmin, addAdmin, removeAdmin, verifyAdminPassword } from './admin.js';
import { getMultiplier, setMultiplier } from './multiplier.js';
import { getXPMultiplier, setXPMultiplier } from './xp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startDashboard(client) {
  const app = express();
  const PORT = 5000;

  // Configurações
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  app.use(express.static(path.join(__dirname, '../public')));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'diva-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
  }));

  // Middleware de autenticação
  const requireAuth = (req, res, next) => {
    if (!req.session.userId || !isAdmin(req.session.userId)) {
      return res.redirect('/login');
    }
    next();
  };

  // Página de login
  app.get('/login', (req, res) => {
    res.render('login', { error: null });
  });

  app.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    
    if (verifyAdminPassword(userId, password)) {
      req.session.userId = userId;
      req.session.userObject = await client.users.fetch(userId);
      return res.redirect('/');
    }
    
    res.render('login', { error: 'ID de usuário ou senha incorretos!' });
  });

  app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
  });

  // Dashboard Principal
  app.get('/', requireAuth, async (req, res) => {
    const stats = {
      servers: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      uptime: process.uptime(),
      ping: client.ws.ping,
      economyUsers: Object.keys(getEconomyUsers()).length,
      xpUsers: Object.keys(getXPUsers()).length,
      admins: getAdmins().length
    };

    const user = await client.users.fetch(req.session.userId);
    
    res.render('index', { stats, user, client, activePage: 'home' }, (err, html) => {
      if (err) {
        console.error('Erro ao renderizar index:', err);
        return res.status(500).send(err.message);
      }
      res.render('layout', { 
        body: html, 
        user, 
        activePage: 'home', 
        title: 'Diva Dashboard',
        theme: 'miku-blue' 
      });
    });
  });

  // Novos Logs e Configurações no Dashboard
  app.get('/logs', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const logs = [
      { time: new Date().toLocaleTimeString(), action: 'Comando !ajuda usado', user: 'Sistema' },
      { time: new Date().toLocaleTimeString(), action: 'Login no Dashboard', user: currentUser.username }
    ];

    const logsHtml = `
      <style>
        .miku-card { border-radius: 15px; overflow: hidden; border: 2px solid #00bfff !important; }
        .miku-header { background: linear-gradient(90deg, #00bfff, #00ced1) !important; color: white !important; }
        .miku-table thead { background-color: rgba(0, 191, 255, 0.1); }
      </style>
      <div class="card bg-dark text-white miku-card shadow-lg">
        <div class="card-header miku-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">📜 Histórico de Atividades</h5>
          <span class="badge bg-white text-info shadow-sm">ATIVO</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0 miku-table">
              <thead>
                <tr>
                  <th class="border-secondary py-3 ps-4">Hora</th>
                  <th class="border-secondary py-3">Ação</th>
                  <th class="border-secondary py-3">Usuário</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(log => `
                  <tr>
                    <td class="border-secondary ps-4 text-info font-monospace">${log.time}</td>
                    <td class="border-secondary">${log.action}</td>
                    <td class="border-secondary"><span class="badge bg-secondary border border-light-subtle">${log.user}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: logsHtml, user: currentUser, activePage: 'logs', title: 'Logs do Sistema' });
  });

  app.get('/settings', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const settingsHtml = `
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card bg-dark text-white border-secondary shadow-lg">
            <div class="card-header border-secondary bg-black">
              <h5 class="mb-0">⚙️ Configurações da Diva</h5>
            </div>
            <div class="card-body p-4">
              <form action="/settings/update" method="POST">
                <div class="mb-4">
                  <label class="form-label text-white-50 small fw-bold">NOME DA DIVA</label>
                  <input type="text" class="form-control bg-black text-white border-secondary py-2" name="botName" value="${client.user.username}">
                </div>
                <div class="mb-4">
                  <label class="form-label text-white-50 small fw-bold">ESTADO MENTAL (STATUS)</label>
                  <select class="form-select bg-black text-white border-secondary py-2" name="status">
                    <option value="online">Online & Radiante</option>
                    <option value="idle">Ausente & Melancólica</option>
                    <option value="dnd">Não Perturbe (Em Concerto)</option>
                  </select>
                </div>
                <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm">SALVAR ALTERAÇÕES</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: settingsHtml, user: currentUser, activePage: 'settings', title: 'Configurações' });
  });

  app.post('/settings/update', requireAuth, async (req, res) => {
    try {
      const { botName, status } = req.body;
      if (botName && botName !== client.user.username) {
        await client.user.setUsername(botName);
      }
      if (status) {
        await client.user.setPresence({ status: status });
      }
      res.redirect('/settings');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).send('Erro interno ao atualizar configurações: ' + error.message);
    }
  });

  app.get('/admins', requireAuth, async (req, res) => {
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    const admins = [];
    for (const id of adminIds) {
      try {
        const u = await client.users.fetch(id.trim());
        admins.push({ id: id.trim(), username: u.username, avatar: u.displayAvatarURL() });
      } catch {
        admins.push({ id: id.trim(), username: 'Desconhecido', avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const adminsHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🛡️ Administradores do Bot</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small">IDs configurados no sistema (ADMIN_IDS). Atualmente editável via Secrets.</p>
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>ID</th></tr></thead>
              <tbody>
                ${admins.map(a => `
                  <tr>
                    <td><img src="${a.avatar}" width="24" class="rounded-circle me-2"> ${a.username}</td>
                    <td>${a.id}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: adminsHtml, user: currentUser, activePage: 'admins', title: 'Administradores' });
  });

  app.get('/stats', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || client.users.cache.size;
    const statsHtml = `
      <div class="row g-4">
        <div class="col-md-4">
          <div class="card bg-dark text-white border-primary shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-primary">${totalServers}</h1>
              <p class="text-white-50">Servidores</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark text-white border-info shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-info">${totalUsers}</h1>
              <p class="text-white-50">Usuários Alcançados</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark text-white border-success shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-success">${client.ws.ping}ms</h1>
              <p class="text-white-50">Latência API</p>
            </div>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: statsHtml, user: currentUser, activePage: 'stats', title: 'Estatísticas' });
  });

  app.get('/servers', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL() || 'https://via.placeholder.com/128',
      memberCount: g.memberCount,
      ownerId: g.ownerId
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const serversHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🏘️ Servidores Conectados</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Ícone</th><th>Nome</th><th>Membros</th><th>ID</th><th>Ação</th></tr></thead>
              <tbody>
                ${guilds.map(g => `
                  <tr>
                    <td><img src="${g.icon}" width="32" height="32" class="rounded-circle"></td>
                    <td>${g.name}</td>
                    <td>${g.memberCount}</td>
                    <td><small class="text-white-50">${g.id}</small></td>
                    <td>
                      <form action="/servers/leave" method="POST" onsubmit="return confirm('Tem certeza que deseja fazer a Diva sair deste servidor?')">
                        <input type="hidden" name="guildId" value="${g.id}">
                        <button class="btn btn-sm btn-outline-danger">SAIR</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: serversHtml, user: currentUser, activePage: 'servers', title: 'Servidores' });
  });

  app.post('/servers/leave', requireAuth, async (req, res) => {
    const { guildId } = req.body;
    if (guildId) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) await guild.leave();
    }
    res.redirect('/servers');
  });

  app.get('/announcement', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const annHtml = `
      <div class="card bg-dark text-white border-success shadow-lg">
        <div class="card-header border-success bg-black">
          <h5 class="mb-0">🎊 Anúncio com Embed</h5>
        </div>
        <div class="card-body">
          <form action="/announcement/send" method="POST">
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">ID DO CANAL</label>
              <input type="text" name="channelId" class="form-control bg-black text-white border-secondary" placeholder="Cole o ID do canal aqui">
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">TÍTULO DO ANÚNCIO</label>
              <input type="text" name="title" class="form-control bg-black text-white border-secondary" placeholder="Ex: Grande Novidade!">
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">MENSAGEM</label>
              <textarea name="message" class="form-control bg-black text-white border-secondary" rows="4" placeholder="Escreva o conteúdo do anúncio..."></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">COR DO EMBED (HEX)</label>
              <input type="color" name="color" class="form-control form-control-color bg-black border-secondary w-100" value="#8b0000">
            </div>
            <button class="btn btn-success w-100 fw-bold py-2">ENVIAR ANÚNCIO PERSONALIZADO</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: annHtml, user: currentUser, activePage: 'announcement', title: 'Anúncios' });
  });

  app.post('/announcement/send', requireAuth, async (req, res) => {
    const { channelId, title, message, color } = req.body;
    if (channelId && message) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          await channel.send({
            embeds: [{
              title: title || 'Anúncio Importante',
              description: message,
              color: parseInt(color.replace('#', ''), 16) || 0x8b0000,
              footer: { text: 'Mensagem Oficial da Diva' },
              timestamp: new Date()
            }]
          });
        }
      } catch (e) {
        console.error('Erro ao enviar anúncio:', e);
      }
    }
    res.redirect('/announcement');
  });

  app.get('/economy', requireAuth, async (req, res) => {
    const economyData = getEconomyUsers();
    const users = [];
    for (const [id, data] of Object.entries(economyData)) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, balance: data.balance || 0, avatar: u.displayAvatarURL() });
      } catch {
        users.push({ id, username: 'Desconhecido', balance: data.balance || 0, avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const economyHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💰 Gestão de Economia (Akita Neru)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Usuário</th><th>Saldo</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><img src="${u.avatar}" width="32" class="rounded-circle me-2"> ${u.username} <small class="text-white-50">(${u.id})</small></td>
                    <td class="text-warning fw-bold">${u.balance.toLocaleString()} ₳</td>
                    <td>
                      <form action="/economy/edit" method="POST" class="d-flex gap-2">
                        <input type="hidden" name="userId" value="${u.id}">
                        <input type="number" name="amount" class="form-control form-control-sm bg-black text-white border-secondary" style="width: 100px" placeholder="Quantia">
                        <button name="action" value="add" class="btn btn-sm btn-success">+</button>
                        <button name="action" value="remove" class="btn btn-sm btn-danger">-</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: economyHtml, user: currentUser, activePage: 'economy', title: 'Economia' });
  });

  app.post('/economy/edit', requireAuth, (req, res) => {
    const { userId, amount, action } = req.body;
    const val = parseInt(amount);
    if (userId && val > 0) {
      if (action === 'add') addBalance(userId, val);
      else if (action === 'remove') removeBalance(userId, val);
      if (client.addDashboardLog) client.addDashboardLog(`Alteração de saldo (${action}): ${val} para ${userId}`, 'Admin Dashboard');
    }
    res.redirect('/economy');
  });

  app.get('/tickets', requireAuth, async (req, res) => {
    const { loadTickets } = await import('./tickets.js');
    const tickets = loadTickets();
    const currentUser = await client.users.fetch(req.session.userId);
    const ticketsHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🎫 Central de Suporte (Tickets)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>ID</th><th>Usuário</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                ${Object.entries(tickets).map(([id, t]) => `
                  <tr>
                    <td><small class="text-info">#${id}</small></td>
                    <td>${t.username}</td>
                    <td><span class="badge ${t.status === 'open' ? 'bg-success' : 'bg-secondary'}">${t.status.toUpperCase()}</span></td>
                    <td>
                      <a href="https://discord.com/channels/${t.guildId}/${t.channelId}" target="_blank" class="btn btn-sm btn-outline-info">Ir para Canal</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: ticketsHtml, user: currentUser, activePage: 'tickets', title: 'Tickets' });
  });

  app.get('/multipliers', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const multHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">⚡ Multiplicadores Globais</h5>
        </div>
        <div class="card-body">
          <form action="/multipliers/update" method="POST">
            <div class="mb-4">
              <label class="form-label text-white-50 small fw-bold">MULTIPLICADOR DE ECONOMIA (ATUAL: ${getMultiplier()}x)</label>
              <input type="number" step="0.1" name="economyMult" class="form-control bg-black text-white border-secondary" value="${getMultiplier()}">
            </div>
            <div class="mb-4">
              <label class="form-label text-white-50 small fw-bold">MULTIPLICADOR DE XP (ATUAL: ${getXPMultiplier()}x)</label>
              <input type="number" step="0.1" name="xpMult" class="form-control bg-black text-white border-secondary" value="${getXPMultiplier()}">
            </div>
            <button class="btn btn-primary w-100 fw-bold">ATUALIZAR MULTIPLICADORES</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: multHtml, user: currentUser, activePage: 'multipliers', title: 'Multiplicadores' });
  });

  app.post('/multipliers/update', requireAuth, (req, res) => {
    const { economyMult, xpMult } = req.body;
    if (economyMult) setMultiplier(parseFloat(economyMult));
    if (xpMult) setXPMultiplier(parseFloat(xpMult));
    if (client.addDashboardLog) client.addDashboardLog(`Multiplicadores atualizados: Eco=${economyMult}x, XP=${xpMult}x`, 'Admin Dashboard');
    res.redirect('/multipliers');
  });

  app.get('/afk', requireAuth, async (req, res) => {
    const { getAFKUsers } = await import('./afk.js');
    const afkUsers = getAFKUsers ? getAFKUsers() : {};
    const users = [];
    for (const [id, data] of Object.entries(afkUsers)) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, reason: data.reason, time: new Date(data.startTime).toLocaleTimeString() });
      } catch {
        users.push({ id, username: 'Desconhecido', reason: data.reason, time: 'Desconhecida' });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const afkHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💤 Usuários em Modo AFK</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>Motivo</th><th>Desde</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>${u.username} <small class="text-white-50">(${u.id})</small></td>
                    <td>${u.reason}</td>
                    <td class="text-info">${u.time}</td>
                    <td>
                      <form action="/afk/remove" method="POST" style="display:inline">
                        <input type="hidden" name="userId" value="${u.id}">
                        <button class="btn btn-sm btn-outline-warning">REMOVER AFK</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: afkHtml, user: currentUser, activePage: 'afk', title: 'AFK' });
  });

  app.post('/afk/remove', requireAuth, async (req, res) => {
    const { removeAFK } = await import('./afk.js');
    if (req.body.userId) removeAFK(req.body.userId);
    res.redirect('/afk');
  });

  app.get('/invite', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const inviteHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg text-center p-5">
        <i class="bi bi-person-plus-fill display-1 text-primary mb-4"></i>
        <h2 class="fw-bold">Convide a Diva!</h2>
        <p class="text-white-50 mb-4">Compartilhe o link abaixo para adicionar a Diva em outros servidores.</p>
        <div class="input-group mb-3">
          <input type="text" class="form-control bg-black text-white border-primary" value="${inviteLink}" readonly id="inviteLink">
          <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${inviteLink}'); alert('Link copiado!')">COPIAR</button>
        </div>
        <div class="mt-4">
          <a href="${inviteLink}" target="_blank" class="btn btn-lg btn-outline-primary px-5">ADICIONAR AGORA</a>
        </div>
      </div>
    `;
    res.render('layout', { body: inviteHtml, user: currentUser, activePage: 'invite', title: 'Convite' });
  });

  app.get('/roles', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      roles: g.roles.cache.filter(r => r.name !== '@everyone').map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        members: r.members.size
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const rolesHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">🎭 Cargos por Servidor</h5>
        </div>
        <div class="card-body">
          ${guilds.map(g => `
            <div class="mb-5">
              <h6 class="text-primary fw-bold mb-3 border-bottom border-secondary pb-2">${g.name} <small class="text-white-50">(${g.id})</small></h6>
              <div class="d-flex flex-wrap gap-2">
                ${g.roles.map(r => `
                  <div class="badge border py-2 px-3 d-flex align-items-center" style="border-color: ${r.color} !important; background: rgba(0,0,0,0.3)">
                    <span class="rounded-circle me-2" style="width: 10px; height: 10px; background: ${r.color}"></span>
                    <span>${r.name}</span>
                    <span class="ms-2 text-white-50 small">(${r.members})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: rolesHtml, user: currentUser, activePage: 'roles', title: 'Cargos' });
  });

  app.get('/theme', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const themeHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black text-center">
          <h5 class="mb-0">🎨 Customização de Tema (Eclipse Místico)</h5>
        </div>
        <div class="card-body p-5">
          <div class="row text-center mb-4">
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #0a0a0a; border: 2px solid #8b0000"></div>
              <small class="text-white-50">Sombrio</small>
            </div>
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #000; border: 2px solid #00bfff"></div>
              <small class="text-white-50">Ciano</small>
            </div>
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #1a1a1a; border: 2px solid #ff00ff"></div>
              <small class="text-white-50">Neon</small>
            </div>
          </div>
          <div class="alert alert-info bg-black border-info text-info small">
            <i class="bi bi-info-circle me-2"></i> Em breve: Seleção de paleta de cores personalizada para o Dashboard!
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: themeHtml, user: currentUser, activePage: 'theme', title: 'Tema' });
  });

  app.get('/commands', requireAuth, async (req, res) => {
    const { commands } = await import('./commands.js');
    const currentUser = await client.users.fetch(req.session.userId);
    const commandsHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">📜 Comandos da Diva</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Prefixo</th><th>Comando</th><th>Aliases</th><th>Descrição</th></tr></thead>
              <tbody>
                ${Object.entries(commands).map(([name, cmd]) => `
                  <tr>
                    <td><span class="badge bg-primary">!</span></td>
                    <td class="text-info fw-bold">${name}</td>
                    <td>${cmd.aliases ? cmd.aliases.map(a => `<span class="badge bg-secondary me-1">${a}</span>`).join('') : '<small class="text-white-50">Nenhum</small>'}</td>
                    <td>${cmd.description || 'Sem descrição.'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: commandsHtml, user: currentUser, activePage: 'commands', title: 'Comandos' });
  });

  app.get('/channels', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const channelsHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">📺 Canais de Texto por Servidor</h5>
        </div>
        <div class="card-body">
          ${guilds.map(g => `
            <div class="mb-4">
              <h6 class="text-primary fw-bold mb-2">${g.name}</h6>
              <div class="list-group list-group-flush bg-black rounded border border-secondary">
                ${g.channels.map(c => `
                  <div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <span># ${c.name}</span>
                    <small class="text-white-50">${c.id}</small>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: channelsHtml, user: currentUser, activePage: 'channels', title: 'Canais' });
  });

  app.get('/autorole', requireAuth, async (req, res) => {
    const { getAutoRoles } = await import('./autorole.js').catch(() => ({}));
    const autoRoles = getAutoRoles ? getAutoRoles() : {};
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      currentRole: autoRoles[g.id] || null,
      roles: g.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).map(r => ({
        id: r.id,
        name: r.name
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const autoroleHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">🤖 Gerenciamento de Auto-Role</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Defina um cargo que novos membros receberão automaticamente ao entrar no servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/autorole/update" method="POST" class="d-flex gap-2">
                <input type="hidden" name="guildId" value="${g.id}">
                <select name="roleId" class="form-select bg-dark text-white border-secondary">
                  <option value="">Desativado</option>
                  ${g.roles.map(r => `<option value="${r.id}" ${g.currentRole === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
                <button class="btn btn-primary px-4">SALVAR</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: autoroleHtml, user: currentUser, activePage: 'autorole', title: 'Auto-Role' });
  });

  app.post('/autorole/update', requireAuth, async (req, res) => {
    const { setAutoRole } = await import('./autorole.js').catch(() => ({}));
    const { guildId, roleId } = req.body;
    if (guildId && setAutoRole) {
      setAutoRole(guildId, roleId || null);
      if (client.addDashboardLog) client.addDashboardLog(`Auto-Role atualizado no servidor ${guildId}`, 'Admin Dashboard');
    }
    res.redirect('/autorole');
  });

  app.get('/members', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount
    }));
    const membersHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">👥 Lista de Membros (Resumo)</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-info bg-black border-info text-info small mb-4">
            <i class="bi bi-info-circle me-2"></i> Devido aos limites do Discord, mostramos apenas o resumo de membros por servidor aqui.
          </div>
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Servidor</th><th>Total de Membros</th></tr></thead>
              <tbody>
                ${guilds.map(g => `
                  <tr>
                    <td>${g.name}</td>
                    <td class="text-info fw-bold">${g.memberCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: membersHtml, user: currentUser, activePage: 'members', title: 'Membros' });
  });

  app.get('/mod', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const modHtml = `
      <div class="card bg-dark text-white border-danger shadow-lg">
        <div class="card-header border-danger bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🛡️ Central de Moderação</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Ações rápidas de moderação global (use com cautela).</p>
          <form action="/mod/action" method="POST" class="row g-3">
            <div class="col-md-6">
              <label class="form-label small text-white-50 fw-bold">ID DO USUÁRIO</label>
              <input type="text" name="userId" class="form-control bg-black text-white border-secondary" placeholder="ID do infrator">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-white-50 fw-bold">ID DO SERVIDOR</label>
              <input type="text" name="guildId" class="form-control bg-black text-white border-secondary" placeholder="ID do servidor">
            </div>
            <div class="col-12">
              <label class="form-label small text-white-50 fw-bold">MOTIVO</label>
              <textarea name="reason" class="form-control bg-black text-white border-secondary" rows="2" placeholder="Ex: Spam excessivo"></textarea>
            </div>
            <div class="col-12 d-flex gap-2">
              <button name="action" value="kick" class="btn btn-warning flex-grow-1 fw-bold">EXPULSAR (KICK)</button>
              <button name="action" value="ban" class="btn btn-danger flex-grow-1 fw-bold">BANIR (BAN)</button>
            </div>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: modHtml, user: currentUser, activePage: 'mod', title: 'Moderação' });
  });

  app.post('/mod/action', requireAuth, async (req, res) => {
    const { userId, guildId, reason, action } = req.body;
    if (userId && guildId) {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            if (action === 'kick') await member.kick(reason);
            else if (action === 'ban') await member.ban({ reason });
            if (client.addDashboardLog) client.addDashboardLog(`Moderação (${action}): ${userId} no servidor ${guildId}`, 'Admin Dashboard');
          }
        }
      } catch (e) {
        console.error('Erro na moderação via dashboard:', e);
      }
    }
    res.redirect('/mod');
  });

  app.get('/errors', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const errorsHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">⚠️ Monitor de Erros Internos</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-dark bg-black border-secondary text-white-50 small mb-0">
            <i class="bi bi-bug me-2"></i> No momento, todos os erros estão sendo capturados e exibidos nos logs em tempo real para sua conveniência.
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: errorsHtml, user: currentUser, activePage: 'errors', title: 'Erros' });
  });

  app.get('/messages', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({ id: c.id, name: c.name }))
    }));
    const msgHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg mb-4">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">👋 Mensagens de Boas-Vindas & Saída (Estilo Loritta)</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Configure as mensagens automáticas que a Diva enviará quando alguém entrar ou sair do servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/messages/update" method="POST">
                <input type="hidden" name="guildId" value="${g.id}">
                <div class="mb-3">
                  <label class="form-label small text-white-50">CANAL DE MENSAGENS</label>
                  <select name="channelId" class="form-select bg-dark text-white border-secondary">
                    <option value="">Desativado</option>
                    ${g.channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-white-50">MENSAGEM DE ENTRADA</label>
                  <textarea name="welcomeMsg" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="Bem-vindo {user} ao {server}!"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-white-50">MENSAGEM DE SAÍDA</label>
                  <textarea name="goodbyeMsg" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="{user} saiu do servidor."></textarea>
                </div>
                <button class="btn btn-primary w-100 fw-bold">SALVAR CONFIGURAÇÃO</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: msgHtml, user: currentUser, activePage: 'messages', title: 'Mensagens' });
  });

  app.post('/messages/update', requireAuth, (req, res) => {
    const { guildId, channelId, welcomeMsg, goodbyeMsg } = req.body;
    if (client.addDashboardLog) client.addDashboardLog(`Configuração de mensagens atualizada no servidor ${guildId}`, 'Admin Dashboard');
    res.redirect('/messages');
  });

  app.get('/audit', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({ id: c.id, name: c.name }))
    }));
    const auditHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black">
          <h5 class="mb-0">🛡️ Logs de Auditoria (Modlogs)</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Escolha um canal para registrar ações de moderação e eventos do servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/audit/update" method="POST">
                <input type="hidden" name="guildId" value="${g.id}">
                <div class="mb-3">
                  <label class="form-label small text-white-50">CANAL DE LOGS</label>
                  <select name="logChannelId" class="form-select bg-dark text-white border-secondary">
                    <option value="">Desativado</option>
                    ${g.channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" name="logMessages" checked>
                  <label class="form-check-label small">Log de Mensagens Deletadas</label>
                </div>
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" name="logMod" checked>
                  <label class="form-check-label small">Log de Ações de Moderação</label>
                </div>
                <button class="btn btn-warning w-100 fw-bold">SALVAR CONFIGURAÇÃO</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: auditHtml, user: currentUser, activePage: 'audit', title: 'Auditoria' });
  });

  app.post('/audit/update', requireAuth, (req, res) => {
    const { guildId, logChannelId } = req.body;
    if (client.addDashboardLog) client.addDashboardLog(`Canal de auditoria configurado no servidor ${guildId}`, 'Admin Dashboard');
    res.redirect('/audit');
  });

  app.get('/slash-commands', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const slashHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black">
          <h5 class="mb-0">⚡ Slash Commands (/)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Nome</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>/ping</td><td>Verifica a latência do bot</td></tr>
                <tr><td>/daily</td><td>Resgata sua recompensa diária</td></tr>
                <tr><td>/xp</td><td>Mostra seu nível atual</td></tr>
                <tr><td>/ship</td><td>Calcula o amor entre dois usuários</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: slashHtml, user: currentUser, activePage: 'slash-commands', title: 'Slash Commands' });
  });

  app.get('/responses', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const responsesHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg mb-4">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">🤖 Auto-Respostas (Gatilhos)</h5>
        </div>
        <div class="card-body">
          <form action="/responses/add" method="POST" class="mb-4">
            <div class="row g-2">
              <div class="col-md-5">
                <input type="text" name="trigger" class="form-control bg-black text-white border-secondary" placeholder="Se o usuário disser...">
              </div>
              <div class="col-md-5">
                <input type="text" name="response" class="form-control bg-black text-white border-secondary" placeholder="A Diva responde...">
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary w-100 fw-bold">ADICIONAR</button>
              </div>
            </div>
          </form>
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Gatilho</th><th>Resposta</th><th>Ação</th></tr></thead>
              <tbody>
                <tr>
                  <td><span class="badge bg-info">bom dia</span></td>
                  <td>Bom dia, flor do dia! 💙</td>
                  <td><button class="btn btn-sm btn-outline-danger">Remover</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: responsesHtml, user: currentUser, activePage: 'responses', title: 'Auto-Respostas' });
  });

  app.get('/history', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const historyHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💬 Histórico de Conversas (Gemini AI)</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th class="ps-4">Usuário</th>
                  <th>Última Mensagem</th>
                  <th>Interações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="ps-4">ExemploUser</td>
                  <td class="text-white-50 small">"Como você está hoje?"</td>
                  <td><span class="badge bg-primary">15</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: historyHtml, user: currentUser, activePage: 'history', title: 'Histórico' });
  });

  app.get('/blacklist', requireAuth, async (req, res) => {
    const { getBlacklist } = await import('./blacklist.js');
    const blacklistedIds = getBlacklist ? getBlacklist() : [];
    const users = [];
    for (const id of blacklistedIds) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, avatar: u.displayAvatarURL() });
      } catch {
        users.push({ id, username: 'Desconhecido', avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const blacklistHtml = `
      <div class="card bg-dark text-white border-danger shadow-lg">
        <div class="card-header border-danger bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🚫 Gestão de Blacklist</h5>
        </div>
        <div class="card-body">
          <form action="/blacklist/add" method="POST" class="mb-4">
            <div class="input-group">
              <input type="text" name="userId" class="form-control bg-black text-white border-secondary" placeholder="ID do Usuário para banir do bot">
              <button class="btn btn-danger">ADICIONAR</button>
            </div>
          </form>
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>ID</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><img src="${u.avatar}" width="24" class="rounded-circle me-2"> ${u.username}</td>
                    <td>${u.id}</td>
                    <td>
                      <form action="/blacklist/remove" method="POST" style="display:inline">
                        <input type="hidden" name="userId" value="${u.id}">
                        <button class="btn btn-sm btn-outline-warning">REMOVER</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: blacklistHtml, user: currentUser, activePage: 'blacklist', title: 'Blacklist' });
  });

  app.post('/blacklist/add', requireAuth, async (req, res) => {
    const { addToBlacklist } = await import('./blacklist.js');
    if (req.body.userId) addToBlacklist(req.body.userId);
    res.redirect('/blacklist');
  });

  app.post('/blacklist/remove', requireAuth, async (req, res) => {
    const { removeFromBlacklist } = await import('./blacklist.js');
    if (req.body.userId) removeFromBlacklist(req.body.userId);
    res.redirect('/blacklist');
  });

  app.get('/broadcast', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const broadcastHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black">
          <h5 class="mb-0">📢 Transmissão Global</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small">Envie uma mensagem para todos os servidores que a Diva está!</p>
          <form action="/broadcast/send" method="POST">
            <div class="mb-3">
              <textarea name="message" class="form-control bg-black text-white border-secondary" rows="4" placeholder="Sua mensagem aqui..."></textarea>
            </div>
            <button class="btn btn-info w-100 fw-bold">ENVIAR PARA TODOS OS SERVIDORES</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: broadcastHtml, user: currentUser, activePage: 'broadcast', title: 'Broadcast' });
  });

  app.post('/broadcast/send', requireAuth, async (req, res) => {
    const { message } = req.body;
    if (message) {
      client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
        if (channel) channel.send({ embeds: [{ color: 0x00bfff, title: '📢 Comunicado da Diva', description: message, footer: { text: 'Enviado via Dashboard' } }] }).catch(() => {});
      });
    }
    res.redirect('/broadcast');
  });

  // Variável global para armazenar os últimos logs em memória
  const botLogs = [];
  const MAX_LOGS = 50;

  function addBotLog(action, user) {
    botLogs.unshift({ time: new Date().toLocaleTimeString(), action, user });
    if (botLogs.length > MAX_LOGS) botLogs.pop();
  }

  // Exportar a função para ser usada em outros arquivos
  client.addDashboardLog = addBotLog;

  app.get('/logs', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const logsHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary d-flex justify-content-between align-items-center bg-black">
          <h5 class="mb-0">📜 Logs do Bot em Tempo Real</h5>
          <span class="badge bg-success shadow-sm animate-pulse">LIVE</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th class="border-secondary py-3 ps-4">Hora</th>
                  <th class="border-secondary py-3">Ação / Comando</th>
                  <th class="border-secondary py-3">Usuário</th>
                </tr>
              </thead>
              <tbody id="logs-body">
                ${botLogs.length > 0 ? botLogs.map(log => `
                  <tr>
                    <td class="border-secondary ps-4 text-info font-monospace">${log.time}</td>
                    <td class="border-secondary">${log.action}</td>
                    <td class="border-secondary"><span class="badge bg-secondary border border-light-subtle">${log.user}</span></td>
                  </tr>
                `).join('') : '<tr><td colspan="3" class="text-center py-4 text-white-50">Nenhum log registrado ainda...</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <script>
        // Auto-refresh simples a cada 5 segundos para simular tempo real
        setTimeout(() => location.reload(), 5000);
      </script>
      <style>
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      </style>
    `;
    res.render('layout', { body: logsHtml, user: currentUser, activePage: 'logs', title: 'Logs do Sistema' });
  });

  app.get('/economy', requireAuth, async (req, res) => {
    const economyData = getEconomyUsers();
    const users = [];
    for (const [id, data] of Object.entries(economyData)) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, balance: data.balance || 0, avatar: u.displayAvatarURL() });
      } catch {
        users.push({ id, username: 'Desconhecido', balance: data.balance || 0, avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const economyHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💰 Gestão de Economia (Akita Neru)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Usuário</th><th>Saldo</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><img src="${u.avatar}" width="32" class="rounded-circle me-2"> ${u.username} <small class="text-white-50">(${u.id})</small></td>
                    <td class="text-warning fw-bold">${u.balance.toLocaleString()} ₳</td>
                    <td>
                      <form action="/economy/edit" method="POST" class="d-flex gap-2">
                        <input type="hidden" name="userId" value="${u.id}">
                        <input type="number" name="amount" class="form-control form-control-sm bg-black text-white border-secondary" style="width: 100px" placeholder="Quantia">
                        <button name="action" value="add" class="btn btn-sm btn-success">+</button>
                        <button name="action" value="remove" class="btn btn-sm btn-danger">-</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: economyHtml, user: currentUser, activePage: 'economy', title: 'Economia' });
  });

  app.post('/economy/edit', requireAuth, (req, res) => {
    const { userId, amount, action } = req.body;
    const val = parseInt(amount);
    if (userId && val > 0) {
      if (action === 'add') addBalance(userId, val);
      else if (action === 'remove') removeBalance(userId, val);
      client.addDashboardLog(`Alteração de saldo (${action}): ${val} para ${userId}`, 'Admin Dashboard');
    }
    res.redirect('/economy');
  });

  app.get('/settings', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const settingsHtml = `
      <div class="card bg-dark text-white border-secondary">
        <div class="card-header border-secondary">
          <h5 class="mb-0">⚙️ Configurações da Diva</h5>
        </div>
        <div class="card-body">
          <form action="/settings/update" method="POST">
            <div class="mb-3">
              <label class="form-label">Nome do Bot</label>
              <input type="text" class="form-control bg-dark text-white border-secondary" name="botName" value="${client.user.username}">
            </div>
            <div class="mb-3">
              <label class="form-label">Status da Atividade</label>
              <select class="form-select bg-dark text-white border-secondary" name="status">
                <option value="online">Online</option>
                <option value="idle">Ausente</option>
                <option value="dnd">Não Perturbe</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary w-100">Salvar Alterações</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: settingsHtml, user: currentUser, activePage: 'settings', title: 'Configurações' });
  });

  app.post('/settings/update', requireAuth, async (req, res) => {
    try {
      const { botName, status } = req.body;
      if (botName && botName !== client.user.username) {
        await client.user.setUsername(botName);
      }
      if (status) {
        await client.user.setPresence({ status: status });
      }
      res.redirect('/settings');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(500).send('Erro interno ao atualizar configurações: ' + error.message);
    }
  });

  app.get('/admins', requireAuth, async (req, res) => {
    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',') : [];
    const admins = [];
    for (const id of adminIds) {
      try {
        const u = await client.users.fetch(id.trim());
        admins.push({ id: id.trim(), username: u.username, avatar: u.displayAvatarURL() });
      } catch {
        admins.push({ id: id.trim(), username: 'Desconhecido', avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const adminsHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🛡️ Administradores do Bot</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small">IDs configurados no sistema (ADMIN_IDS). Atualmente editável via Secrets.</p>
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>ID</th></tr></thead>
              <tbody>
                ${admins.map(a => `
                  <tr>
                    <td><img src="${a.avatar}" width="24" class="rounded-circle me-2"> ${a.username}</td>
                    <td>${a.id}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: adminsHtml, user: currentUser, activePage: 'admins', title: 'Administradores' });
  });

  app.get('/stats', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const totalServers = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0) || client.users.cache.size;
    const statsHtml = `
      <div class="row g-4">
        <div class="col-md-4">
          <div class="card bg-dark text-white border-primary shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-primary">${totalServers}</h1>
              <p class="text-white-50">Servidores</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark text-white border-info shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-info">${totalUsers}</h1>
              <p class="text-white-50">Usuários Alcançados</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-dark text-white border-success shadow">
            <div class="card-body text-center">
              <h1 class="display-4 fw-bold text-success">${client.ws.ping}ms</h1>
              <p class="text-white-50">Latência API</p>
            </div>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: statsHtml, user: currentUser, activePage: 'stats', title: 'Estatísticas' });
  });

  app.get('/servers', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL() || 'https://via.placeholder.com/128',
      memberCount: g.memberCount,
      ownerId: g.ownerId
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const serversHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🏘️ Servidores Conectados</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Ícone</th><th>Nome</th><th>Membros</th><th>ID</th><th>Ação</th></tr></thead>
              <tbody>
                ${guilds.map(g => `
                  <tr>
                    <td><img src="${g.icon}" width="32" height="32" class="rounded-circle"></td>
                    <td>${g.name}</td>
                    <td>${g.memberCount}</td>
                    <td><small class="text-white-50">${g.id}</small></td>
                    <td>
                      <form action="/servers/leave" method="POST" onsubmit="return confirm('Tem certeza que deseja fazer a Diva sair deste servidor?')">
                        <input type="hidden" name="guildId" value="${g.id}">
                        <button class="btn btn-sm btn-outline-danger">SAIR</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: serversHtml, user: currentUser, activePage: 'servers', title: 'Servidores' });
  });

  app.post('/servers/leave', requireAuth, async (req, res) => {
    const { guildId } = req.body;
    if (guildId) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) await guild.leave();
    }
    res.redirect('/servers');
  });

  app.get('/announcement', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const annHtml = `
      <div class="card bg-dark text-white border-success shadow-lg">
        <div class="card-header border-success bg-black">
          <h5 class="mb-0">🎊 Anúncio com Embed</h5>
        </div>
        <div class="card-body">
          <form action="/announcement/send" method="POST">
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">ID DO CANAL</label>
              <input type="text" name="channelId" class="form-control bg-black text-white border-secondary" placeholder="Cole o ID do canal aqui">
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">TÍTULO DO ANÚNCIO</label>
              <input type="text" name="title" class="form-control bg-black text-white border-secondary" placeholder="Ex: Grande Novidade!">
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">MENSAGEM</label>
              <textarea name="message" class="form-control bg-black text-white border-secondary" rows="4" placeholder="Escreva o conteúdo do anúncio..."></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label text-white-50 small fw-bold">COR DO EMBED (HEX)</label>
              <input type="color" name="color" class="form-control form-control-color bg-black border-secondary w-100" value="#8b0000">
            </div>
            <button class="btn btn-success w-100 fw-bold py-2">ENVIAR ANÚNCIO PERSONALIZADO</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: annHtml, user: currentUser, activePage: 'announcement', title: 'Anúncios' });
  });

  app.post('/announcement/send', requireAuth, async (req, res) => {
    const { channelId, title, message, color } = req.body;
    if (channelId && message) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          await channel.send({
            embeds: [{
              title: title || 'Anúncio Importante',
              description: message,
              color: parseInt(color.replace('#', ''), 16) || 0x8b0000,
              footer: { text: 'Mensagem Oficial da Diva' },
              timestamp: new Date()
            }]
          });
        }
      } catch (e) {
        console.error('Erro ao enviar anúncio:', e);
      }
    }
    res.redirect('/announcement');
  });

  app.get('/economy', requireAuth, async (req, res) => {
    const economyData = getEconomyUsers();
    const users = [];
    for (const [id, data] of Object.entries(economyData)) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, balance: data.balance || 0, avatar: u.displayAvatarURL() });
      } catch {
        users.push({ id, username: 'Desconhecido', balance: data.balance || 0, avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const economyHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💰 Gestão de Economia (Akita Neru)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Usuário</th><th>Saldo</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><img src="${u.avatar}" width="32" class="rounded-circle me-2"> ${u.username} <small class="text-white-50">(${u.id})</small></td>
                    <td class="text-warning fw-bold">${u.balance.toLocaleString()} ₳</td>
                    <td>
                      <form action="/economy/edit" method="POST" class="d-flex gap-2">
                        <input type="hidden" name="userId" value="${u.id}">
                        <input type="number" name="amount" class="form-control form-control-sm bg-black text-white border-secondary" style="width: 100px" placeholder="Quantia">
                        <button name="action" value="add" class="btn btn-sm btn-success">+</button>
                        <button name="action" value="remove" class="btn btn-sm btn-danger">-</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: economyHtml, user: currentUser, activePage: 'economy', title: 'Economia' });
  });

  app.post('/economy/edit', requireAuth, (req, res) => {
    const { userId, amount, action } = req.body;
    const val = parseInt(amount);
    if (userId && val > 0) {
      if (action === 'add') addBalance(userId, val);
      else if (action === 'remove') removeBalance(userId, val);
      if (client.addDashboardLog) client.addDashboardLog(`Alteração de saldo (${action}): ${val} para ${userId}`, 'Admin Dashboard');
    }
    res.redirect('/economy');
  });

  app.get('/tickets', requireAuth, async (req, res) => {
    const { loadTickets } = await import('./tickets.js');
    const tickets = loadTickets();
    const currentUser = await client.users.fetch(req.session.userId);
    const ticketsHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🎫 Central de Suporte (Tickets)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>ID</th><th>Usuário</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                ${Object.entries(tickets).map(([id, t]) => `
                  <tr>
                    <td><small class="text-info">#${id}</small></td>
                    <td>${t.username}</td>
                    <td><span class="badge ${t.status === 'open' ? 'bg-success' : 'bg-secondary'}">${t.status.toUpperCase()}</span></td>
                    <td>
                      <a href="https://discord.com/channels/${t.guildId}/${t.channelId}" target="_blank" class="btn btn-sm btn-outline-info">Ir para Canal</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: ticketsHtml, user: currentUser, activePage: 'tickets', title: 'Tickets' });
  });

  app.get('/multipliers', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const multHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">⚡ Multiplicadores Globais</h5>
        </div>
        <div class="card-body">
          <form action="/multipliers/update" method="POST">
            <div class="mb-4">
              <label class="form-label text-white-50 small fw-bold">MULTIPLICADOR DE ECONOMIA (ATUAL: ${getMultiplier()}x)</label>
              <input type="number" step="0.1" name="economyMult" class="form-control bg-black text-white border-secondary" value="${getMultiplier()}">
            </div>
            <div class="mb-4">
              <label class="form-label text-white-50 small fw-bold">MULTIPLICADOR DE XP (ATUAL: ${getXPMultiplier()}x)</label>
              <input type="number" step="0.1" name="xpMult" class="form-control bg-black text-white border-secondary" value="${getXPMultiplier()}">
            </div>
            <button class="btn btn-primary w-100 fw-bold">ATUALIZAR MULTIPLICADORES</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: multHtml, user: currentUser, activePage: 'multipliers', title: 'Multiplicadores' });
  });

  app.post('/multipliers/update', requireAuth, (req, res) => {
    const { economyMult, xpMult } = req.body;
    if (economyMult) setMultiplier(parseFloat(economyMult));
    if (xpMult) setXPMultiplier(parseFloat(xpMult));
    if (client.addDashboardLog) client.addDashboardLog(`Multiplicadores atualizados: Eco=${economyMult}x, XP=${xpMult}x`, 'Admin Dashboard');
    res.redirect('/multipliers');
  });

  app.get('/afk', requireAuth, async (req, res) => {
    const { getAFKUsers } = await import('./afk.js');
    const afkUsers = getAFKUsers ? getAFKUsers() : {};
    const users = [];
    for (const [id, data] of Object.entries(afkUsers)) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, reason: data.reason, time: new Date(data.startTime).toLocaleTimeString() });
      } catch {
        users.push({ id, username: 'Desconhecido', reason: data.reason, time: 'Desconhecida' });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const afkHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💤 Usuários em Modo AFK</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>Motivo</th><th>Desde</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>${u.username} <small class="text-white-50">(${u.id})</small></td>
                    <td>${u.reason}</td>
                    <td class="text-info">${u.time}</td>
                    <td>
                      <form action="/afk/remove" method="POST" style="display:inline">
                        <input type="hidden" name="userId" value="${u.id}">
                        <button class="btn btn-sm btn-outline-warning">REMOVER AFK</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: afkHtml, user: currentUser, activePage: 'afk', title: 'AFK' });
  });

  app.post('/afk/remove', requireAuth, async (req, res) => {
    const { removeAFK } = await import('./afk.js');
    if (req.body.userId) removeAFK(req.body.userId);
    res.redirect('/afk');
  });

  app.get('/invite', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
    const inviteHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg text-center p-5">
        <i class="bi bi-person-plus-fill display-1 text-primary mb-4"></i>
        <h2 class="fw-bold">Convide a Diva!</h2>
        <p class="text-white-50 mb-4">Compartilhe o link abaixo para adicionar a Diva em outros servidores.</p>
        <div class="input-group mb-3">
          <input type="text" class="form-control bg-black text-white border-primary" value="${inviteLink}" readonly id="inviteLink">
          <button class="btn btn-primary" onclick="navigator.clipboard.writeText('${inviteLink}'); alert('Link copiado!')">COPIAR</button>
        </div>
        <div class="mt-4">
          <a href="${inviteLink}" target="_blank" class="btn btn-lg btn-outline-primary px-5">ADICIONAR AGORA</a>
        </div>
      </div>
    `;
    res.render('layout', { body: inviteHtml, user: currentUser, activePage: 'invite', title: 'Convite' });
  });

  app.get('/roles', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      roles: g.roles.cache.filter(r => r.name !== '@everyone').map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        members: r.members.size
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const rolesHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">🎭 Cargos por Servidor</h5>
        </div>
        <div class="card-body">
          ${guilds.map(g => `
            <div class="mb-5">
              <h6 class="text-primary fw-bold mb-3 border-bottom border-secondary pb-2">${g.name} <small class="text-white-50">(${g.id})</small></h6>
              <div class="d-flex flex-wrap gap-2">
                ${g.roles.map(r => `
                  <div class="badge border py-2 px-3 d-flex align-items-center" style="border-color: ${r.color} !important; background: rgba(0,0,0,0.3)">
                    <span class="rounded-circle me-2" style="width: 10px; height: 10px; background: ${r.color}"></span>
                    <span>${r.name}</span>
                    <span class="ms-2 text-white-50 small">(${r.members})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: rolesHtml, user: currentUser, activePage: 'roles', title: 'Cargos' });
  });

  app.get('/theme', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const themeHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black text-center">
          <h5 class="mb-0">🎨 Customização de Tema (Eclipse Místico)</h5>
        </div>
        <div class="card-body p-5">
          <div class="row text-center mb-4">
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #0a0a0a; border: 2px solid #8b0000"></div>
              <small class="text-white-50">Sombrio</small>
            </div>
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #000; border: 2px solid #00bfff"></div>
              <small class="text-white-50">Ciano</small>
            </div>
            <div class="col-4">
              <div class="rounded-circle mx-auto mb-2" style="width: 50px; height: 50px; background: #1a1a1a; border: 2px solid #ff00ff"></div>
              <small class="text-white-50">Neon</small>
            </div>
          </div>
          <div class="alert alert-info bg-black border-info text-info small">
            <i class="bi bi-info-circle me-2"></i> Em breve: Seleção de paleta de cores personalizada para o Dashboard!
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: themeHtml, user: currentUser, activePage: 'theme', title: 'Tema' });
  });

  app.get('/commands', requireAuth, async (req, res) => {
    const { commands } = await import('./commands.js');
    const currentUser = await client.users.fetch(req.session.userId);
    const commandsHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">📜 Comandos da Diva</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Prefixo</th><th>Comando</th><th>Aliases</th><th>Descrição</th></tr></thead>
              <tbody>
                ${Object.entries(commands).map(([name, cmd]) => `
                  <tr>
                    <td><span class="badge bg-primary">!</span></td>
                    <td class="text-info fw-bold">${name}</td>
                    <td>${cmd.aliases ? cmd.aliases.map(a => `<span class="badge bg-secondary me-1">${a}</span>`).join('') : '<small class="text-white-50">Nenhum</small>'}</td>
                    <td>${cmd.description || 'Sem descrição.'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: commandsHtml, user: currentUser, activePage: 'commands', title: 'Comandos' });
  });

  app.get('/channels', requireAuth, async (req, res) => {
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const channelsHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">📺 Canais de Texto por Servidor</h5>
        </div>
        <div class="card-body">
          ${guilds.map(g => `
            <div class="mb-4">
              <h6 class="text-primary fw-bold mb-2">${g.name}</h6>
              <div class="list-group list-group-flush bg-black rounded border border-secondary">
                ${g.channels.map(c => `
                  <div class="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                    <span># ${c.name}</span>
                    <small class="text-white-50">${c.id}</small>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: channelsHtml, user: currentUser, activePage: 'channels', title: 'Canais' });
  });

  app.get('/autorole', requireAuth, async (req, res) => {
    const { getAutoRoles } = await import('./autorole.js').catch(() => ({}));
    const autoRoles = getAutoRoles ? getAutoRoles() : {};
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      currentRole: autoRoles[g.id] || null,
      roles: g.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).map(r => ({
        id: r.id,
        name: r.name
      }))
    }));
    const currentUser = await client.users.fetch(req.session.userId);
    const autoroleHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">🤖 Gerenciamento de Auto-Role</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Defina um cargo que novos membros receberão automaticamente ao entrar no servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/autorole/update" method="POST" class="d-flex gap-2">
                <input type="hidden" name="guildId" value="${g.id}">
                <select name="roleId" class="form-select bg-dark text-white border-secondary">
                  <option value="">Desativado</option>
                  ${g.roles.map(r => `<option value="${r.id}" ${g.currentRole === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
                <button class="btn btn-primary px-4">SALVAR</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: autoroleHtml, user: currentUser, activePage: 'autorole', title: 'Auto-Role' });
  });

  app.post('/autorole/update', requireAuth, async (req, res) => {
    const { setAutoRole } = await import('./autorole.js').catch(() => ({}));
    const { guildId, roleId } = req.body;
    if (guildId && setAutoRole) {
      setAutoRole(guildId, roleId || null);
      if (client.addDashboardLog) client.addDashboardLog(`Auto-Role atualizado no servidor ${guildId}`, 'Admin Dashboard');
    }
    res.redirect('/autorole');
  });

  app.get('/members', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      memberCount: g.memberCount
    }));
    const membersHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black">
          <h5 class="mb-0">👥 Lista de Membros (Resumo)</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-info bg-black border-info text-info small mb-4">
            <i class="bi bi-info-circle me-2"></i> Devido aos limites do Discord, mostramos apenas o resumo de membros por servidor aqui.
          </div>
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Servidor</th><th>Total de Membros</th></tr></thead>
              <tbody>
                ${guilds.map(g => `
                  <tr>
                    <td>${g.name}</td>
                    <td class="text-info fw-bold">${g.memberCount}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: membersHtml, user: currentUser, activePage: 'members', title: 'Membros' });
  });

  app.get('/mod', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const modHtml = `
      <div class="card bg-dark text-white border-danger shadow-lg">
        <div class="card-header border-danger bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🛡️ Central de Moderação</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Ações rápidas de moderação global (use com cautela).</p>
          <form action="/mod/action" method="POST" class="row g-3">
            <div class="col-md-6">
              <label class="form-label small text-white-50 fw-bold">ID DO USUÁRIO</label>
              <input type="text" name="userId" class="form-control bg-black text-white border-secondary" placeholder="ID do infrator">
            </div>
            <div class="col-md-6">
              <label class="form-label small text-white-50 fw-bold">ID DO SERVIDOR</label>
              <input type="text" name="guildId" class="form-control bg-black text-white border-secondary" placeholder="ID do servidor">
            </div>
            <div class="col-12">
              <label class="form-label small text-white-50 fw-bold">MOTIVO</label>
              <textarea name="reason" class="form-control bg-black text-white border-secondary" rows="2" placeholder="Ex: Spam excessivo"></textarea>
            </div>
            <div class="col-12 d-flex gap-2">
              <button name="action" value="kick" class="btn btn-warning flex-grow-1 fw-bold">EXPULSAR (KICK)</button>
              <button name="action" value="ban" class="btn btn-danger flex-grow-1 fw-bold">BANIR (BAN)</button>
            </div>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: modHtml, user: currentUser, activePage: 'mod', title: 'Moderação' });
  });

  app.post('/mod/action', requireAuth, async (req, res) => {
    const { userId, guildId, reason, action } = req.body;
    if (userId && guildId) {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            if (action === 'kick') await member.kick(reason);
            else if (action === 'ban') await member.ban({ reason });
            if (client.addDashboardLog) client.addDashboardLog(`Moderação (${action}): ${userId} no servidor ${guildId}`, 'Admin Dashboard');
          }
        }
      } catch (e) {
        console.error('Erro na moderação via dashboard:', e);
      }
    }
    res.redirect('/mod');
  });

  app.get('/errors', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const errorsHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">⚠️ Monitor de Erros Internos</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-dark bg-black border-secondary text-white-50 small mb-0">
            <i class="bi bi-bug me-2"></i> No momento, todos os erros estão sendo capturados e exibidos nos logs em tempo real para sua conveniência.
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: errorsHtml, user: currentUser, activePage: 'errors', title: 'Erros' });
  });

  app.get('/messages', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({ id: c.id, name: c.name }))
    }));
    const msgHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg mb-4">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">👋 Mensagens de Boas-Vindas & Saída (Estilo Loritta)</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Configure as mensagens automáticas que a Diva enviará quando alguém entrar ou sair do servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/messages/update" method="POST">
                <input type="hidden" name="guildId" value="${g.id}">
                <div class="mb-3">
                  <label class="form-label small text-white-50">CANAL DE MENSAGENS</label>
                  <select name="channelId" class="form-select bg-dark text-white border-secondary">
                    <option value="">Desativado</option>
                    ${g.channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-white-50">MENSAGEM DE ENTRADA</label>
                  <textarea name="welcomeMsg" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="Bem-vindo {user} ao {server}!"></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label small text-white-50">MENSAGEM DE SAÍDA</label>
                  <textarea name="goodbyeMsg" class="form-control bg-dark text-white border-secondary" rows="2" placeholder="{user} saiu do servidor."></textarea>
                </div>
                <button class="btn btn-primary w-100 fw-bold">SALVAR CONFIGURAÇÃO</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: msgHtml, user: currentUser, activePage: 'messages', title: 'Mensagens' });
  });

  app.post('/messages/update', requireAuth, (req, res) => {
    const { guildId, channelId, welcomeMsg, goodbyeMsg } = req.body;
    if (client.addDashboardLog) client.addDashboardLog(`Configuração de mensagens atualizada no servidor ${guildId}`, 'Admin Dashboard');
    res.redirect('/messages');
  });

  app.get('/audit', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const guilds = client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      channels: g.channels.cache.filter(c => c.isTextBased()).map(c => ({ id: c.id, name: c.name }))
    }));
    const auditHtml = `
      <div class="card bg-dark text-white border-warning shadow-lg">
        <div class="card-header border-warning bg-black">
          <h5 class="mb-0">🛡️ Logs de Auditoria (Modlogs)</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small mb-4">Escolha um canal para registrar ações de moderação e eventos do servidor.</p>
          ${guilds.map(g => `
            <div class="mb-4 p-3 border border-secondary rounded bg-black">
              <h6 class="text-primary fw-bold mb-3">${g.name}</h6>
              <form action="/audit/update" method="POST">
                <input type="hidden" name="guildId" value="${g.id}">
                <div class="mb-3">
                  <label class="form-label small text-white-50">CANAL DE LOGS</label>
                  <select name="logChannelId" class="form-select bg-dark text-white border-secondary">
                    <option value="">Desativado</option>
                    ${g.channels.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" name="logMessages" checked>
                  <label class="form-check-label small">Log de Mensagens Deletadas</label>
                </div>
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" name="logMod" checked>
                  <label class="form-check-label small">Log de Ações de Moderação</label>
                </div>
                <button class="btn btn-warning w-100 fw-bold">SALVAR CONFIGURAÇÃO</button>
              </form>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    res.render('layout', { body: auditHtml, user: currentUser, activePage: 'audit', title: 'Auditoria' });
  });

  app.post('/audit/update', requireAuth, (req, res) => {
    const { guildId, logChannelId } = req.body;
    if (client.addDashboardLog) client.addDashboardLog(`Canal de auditoria configurado no servidor ${guildId}`, 'Admin Dashboard');
    res.redirect('/audit');
  });

  app.get('/slash-commands', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const slashHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black">
          <h5 class="mb-0">⚡ Slash Commands (/)</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Nome</th><th>Descrição</th></tr></thead>
              <tbody>
                <tr><td>/ping</td><td>Verifica a latência do bot</td></tr>
                <tr><td>/daily</td><td>Resgata sua recompensa diária</td></tr>
                <tr><td>/xp</td><td>Mostra seu nível atual</td></tr>
                <tr><td>/ship</td><td>Calcula o amor entre dois usuários</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: slashHtml, user: currentUser, activePage: 'slash-commands', title: 'Slash Commands' });
  });

  app.get('/responses', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const responsesHtml = `
      <div class="card bg-dark text-white border-primary shadow-lg mb-4">
        <div class="card-header border-primary bg-black">
          <h5 class="mb-0">🤖 Auto-Respostas (Gatilhos)</h5>
        </div>
        <div class="card-body">
          <form action="/responses/add" method="POST" class="mb-4">
            <div class="row g-2">
              <div class="col-md-5">
                <input type="text" name="trigger" class="form-control bg-black text-white border-secondary" placeholder="Se o usuário disser...">
              </div>
              <div class="col-md-5">
                <input type="text" name="response" class="form-control bg-black text-white border-secondary" placeholder="A Diva responde...">
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary w-100 fw-bold">ADICIONAR</button>
              </div>
            </div>
          </form>
          <div class="table-responsive">
            <table class="table table-dark align-middle">
              <thead><tr><th>Gatilho</th><th>Resposta</th><th>Ação</th></tr></thead>
              <tbody>
                <tr>
                  <td><span class="badge bg-info">bom dia</span></td>
                  <td>Bom dia, flor do dia! 💙</td>
                  <td><button class="btn btn-sm btn-outline-danger">Remover</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: responsesHtml, user: currentUser, activePage: 'responses', title: 'Auto-Respostas' });
  });

  app.get('/history', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const historyHtml = `
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">💬 Histórico de Conversas (Gemini AI)</h5>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th class="ps-4">Usuário</th>
                  <th>Última Mensagem</th>
                  <th>Interações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="ps-4">ExemploUser</td>
                  <td class="text-white-50 small">"Como você está hoje?"</td>
                  <td><span class="badge bg-primary">15</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: historyHtml, user: currentUser, activePage: 'history', title: 'Histórico' });
  });

  app.get('/blacklist', requireAuth, async (req, res) => {
    const { getBlacklist } = await import('./blacklist.js');
    const blacklistedIds = getBlacklist ? getBlacklist() : [];
    const users = [];
    for (const id of blacklistedIds) {
      try {
        const u = await client.users.fetch(id);
        users.push({ id, username: u.username, avatar: u.displayAvatarURL() });
      } catch {
        users.push({ id, username: 'Desconhecido', avatar: null });
      }
    }
    const currentUser = await client.users.fetch(req.session.userId);
    const blacklistHtml = `
      <div class="card bg-dark text-white border-danger shadow-lg">
        <div class="card-header border-danger bg-black d-flex justify-content-between align-items-center">
          <h5 class="mb-0">🚫 Gestão de Blacklist</h5>
        </div>
        <div class="card-body">
          <form action="/blacklist/add" method="POST" class="mb-4">
            <div class="input-group">
              <input type="text" name="userId" class="form-control bg-black text-white border-secondary" placeholder="ID do Usuário para banir do bot">
              <button class="btn btn-danger">ADICIONAR</button>
            </div>
          </form>
          <div class="table-responsive">
            <table class="table table-dark">
              <thead><tr><th>Usuário</th><th>ID</th><th>Ações</th></tr></thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><img src="${u.avatar}" width="24" class="rounded-circle me-2"> ${u.username}</td>
                    <td>${u.id}</td>
                    <td>
                      <form action="/blacklist/remove" method="POST" style="display:inline">
                        <input type="hidden" name="userId" value="${u.id}">
                        <button class="btn btn-sm btn-outline-warning">REMOVER</button>
                      </form>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    res.render('layout', { body: blacklistHtml, user: currentUser, activePage: 'blacklist', title: 'Blacklist' });
  });

  app.post('/blacklist/add', requireAuth, async (req, res) => {
    const { addToBlacklist } = await import('./blacklist.js');
    if (req.body.userId) addToBlacklist(req.body.userId);
    res.redirect('/blacklist');
  });

  app.post('/blacklist/remove', requireAuth, async (req, res) => {
    const { removeFromBlacklist } = await import('./blacklist.js');
    if (req.body.userId) removeFromBlacklist(req.body.userId);
    res.redirect('/blacklist');
  });

  app.get('/broadcast', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    const broadcastHtml = `
      <div class="card bg-dark text-white border-info shadow-lg">
        <div class="card-header border-info bg-black">
          <h5 class="mb-0">📢 Transmissão Global</h5>
        </div>
        <div class="card-body">
          <p class="text-white-50 small">Envie uma mensagem para todos os servidores que a Diva está!</p>
          <form action="/broadcast/send" method="POST">
            <div class="mb-3">
              <textarea name="message" class="form-control bg-black text-white border-secondary" rows="4" placeholder="Sua mensagem aqui..."></textarea>
            </div>
            <button class="btn btn-info w-100 fw-bold">ENVIAR PARA TODOS OS SERVIDORES</button>
          </form>
        </div>
      </div>
    `;
    res.render('layout', { body: broadcastHtml, user: currentUser, activePage: 'broadcast', title: 'Broadcast' });
  });

  app.post('/broadcast/send', requireAuth, async (req, res) => {
    const { message } = req.body;
    if (message) {
      client.guilds.cache.forEach(guild => {
        const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user).has('SendMessages'));
        if (channel) channel.send({ embeds: [{ color: 0x00bfff, title: '📢 Comunicado da Diva', description: message, footer: { text: 'Enviado via Dashboard' } }] }).catch(() => {});
      });
    }
    res.redirect('/broadcast');
  });

  // Gerenciar Economia
  app.get('/economy', requireAuth, async (req, res) => {
    const economyData = getEconomyUsers();
    const users = [];

    for (const [userId, data] of Object.entries(economyData)) {
      try {
        const user = await client.users.fetch(userId);
        users.push({
          id: userId,
          username: user.username,
          avatar: user.displayAvatarURL(),
          balance: data.balance,
          lastDaily: data.lastDaily
        });
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userId}:`, error);
      }
    }

    users.sort((a, b) => b.balance - a.balance);

    const currentUser = await client.users.fetch(req.session.userId);
    res.render('economy', { 
      users, 
      multiplier: getMultiplier(),
      user: currentUser,
      activePage: 'economy'
    }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render('layout', { body: html, user: currentUser, activePage: 'economy', title: 'Economia' });
    });
  });

  app.post('/economy/add', requireAuth, async (req, res) => {
    const { userId, amount } = req.body;
    addBalance(userId, parseInt(amount));
    res.redirect('/economy');
  });

  app.post('/economy/remove', requireAuth, async (req, res) => {
    const { userId, amount } = req.body;
    removeBalance(userId, parseInt(amount));
    res.redirect('/economy');
  });

  app.post('/economy/multiplier', requireAuth, (req, res) => {
    const { multiplier } = req.body;
    setMultiplier(parseFloat(multiplier));
    res.redirect('/economy');
  });

  // Gerenciar XP
  app.get('/xp', requireAuth, async (req, res) => {
    const xpData = getXPUsers();
    const users = [];

    for (const [userId, data] of Object.entries(xpData)) {
      try {
        const user = await client.users.fetch(userId);
        users.push({
          id: userId,
          username: user.username,
          avatar: user.displayAvatarURL(),
          level: data.level,
          xp: data.xp,
          totalXP: data.totalXP
        });
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userId}:`, error);
      }
    }

    users.sort((a, b) => b.level - a.level || b.totalXP - a.totalXP);

    const currentUser = await client.users.fetch(req.session.userId);
    res.render('xp', { 
      users,
      xpMultiplier: getXPMultiplier(),
      user: currentUser,
      activePage: 'xp'
    }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render('layout', { body: html, user: currentUser, activePage: 'xp', title: 'Ranking XP' });
    });
  });

  app.post('/xp/multiplier', requireAuth, (req, res) => {
    const { multiplier } = req.body;
    setXPMultiplier(parseFloat(multiplier));
    res.redirect('/xp');
  });

  // Gerenciar Admins
  app.get('/admins', requireAuth, async (req, res) => {
    const adminIds = getAdmins();
    const admins = [];

    for (const adminId of adminIds) {
      try {
        const user = await client.users.fetch(adminId);
        admins.push({
          id: adminId,
          username: user.username,
          avatar: user.displayAvatarURL()
        });
      } catch (error) {
        console.error(`Erro ao buscar admin ${adminId}:`, error);
      }
    }

    const currentUser = await client.users.fetch(req.session.userId);
    res.render('admins', { 
      admins,
      user: currentUser,
      activePage: 'admins'
    }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render('layout', { body: html, user: currentUser, activePage: 'admins', title: 'Administradores' });
    });
  });

  app.post('/admins/add', requireAuth, (req, res) => {
    const { userId, password } = req.body;
    addAdmin(userId, password || 'admin123');
    res.redirect('/admins');
  });

  app.post('/admins/remove', requireAuth, (req, res) => {
    const { userId } = req.body;
    removeAdmin(userId);
    res.redirect('/admins');
  });

  // Servidores
  app.get('/servers', requireAuth, async (req, res) => {
    const servers = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      members: guild.memberCount,
      channels: guild.channels.cache.size,
      roles: guild.roles.cache.size,
      owner: guild.ownerId
    }));

    const currentUser = await client.users.fetch(req.session.userId);
    res.render('servers', { 
      servers,
      user: currentUser,
      activePage: 'servers'
    }, (err, html) => {
      if (err) return res.status(500).send(err.message);
      res.render('layout', { body: html, user: currentUser, activePage: 'servers', title: 'Servidores' });
    });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Dashboard rodando em http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Porta ${PORT} em uso, tentando porta 5001...`);
      app.listen(5001, '0.0.0.0', () => {
        console.log(`🌐 Dashboard rodando em http://0.0.0.0:5001`);
      });
    } else {
      console.error('❌ Erro ao iniciar dashboard:', err);
    }
  });
}
