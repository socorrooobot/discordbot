
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
      res.render('layout', { body: html, user, activePage: 'home', title: 'Dashboard' });
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
      <div class="card bg-dark text-white border-secondary shadow-lg">
        <div class="card-header border-secondary d-flex justify-content-between align-items-center bg-black">
          <h5 class="mb-0">📜 Logs do Sistema (Tempo Real)</h5>
          <span class="badge bg-success shadow-sm">ATIVO</span>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
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

  app.post('/settings/update', requireAuth, (req, res) => {
    const { botName, status } = req.body;
    if (botName) client.user.setUsername(botName).catch(console.error);
    if (status) client.user.setPresence({ status }).catch(console.error);
    res.redirect('/settings');
  });

  // Novos Logs e Configurações no Dashboard
  app.get('/logs', requireAuth, async (req, res) => {
    const currentUser = await client.users.fetch(req.session.userId);
    // Simulação de logs para a interface
    const logs = [
      { time: new Date().toLocaleTimeString(), action: 'Comando !ajuda usado', user: 'Sistema' },
      { time: new Date().toLocaleTimeString(), action: 'Login no Dashboard', user: currentUser.username }
    ];

    res.render('index', { stats: {}, user: currentUser, client, logs, activePage: 'logs' }, (err, html) => {
      const logsHtml = `
        <div class="card bg-dark text-white border-secondary">
          <div class="card-header border-secondary d-flex justify-content-between align-items-center">
            <h5 class="mb-0">📜 Logs do Sistema (Tempo Real)</h5>
            <span class="badge bg-primary">Online</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th class="border-secondary">Hora</th>
                    <th class="border-secondary">Ação</th>
                    <th class="border-secondary">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  ${logs.map(log => `
                    <tr>
                      <td class="border-secondary text-info">${log.time}</td>
                      <td class="border-secondary">${log.action}</td>
                      <td class="border-secondary"><span class="badge bg-secondary">${log.user}</span></td>
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

  app.post('/settings/update', requireAuth, (req, res) => {
    const { botName, status } = req.body;
    if (botName) client.user.setUsername(botName).catch(console.error);
    if (status) client.user.setPresence({ status }).catch(console.error);
    res.redirect('/settings');
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
