
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllUsers as getEconomyUsers, getBalance, addBalance, removeBalance } from './economy.js';
import { getAllUsers as getXPUsers, getUserInfo } from './xp.js';
import { getAdmins, isAdmin, addAdmin, removeAdmin } from './admin.js';
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
    const { userId } = req.body;
    
    if (isAdmin(userId)) {
      req.session.userId = userId;
      return res.redirect('/');
    }
    
    res.render('login', { error: 'Você não é um administrador!' });
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
    
    res.render('index', { stats, user, client });
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

    res.render('economy', { 
      users, 
      multiplier: getMultiplier(),
      user: await client.users.fetch(req.session.userId)
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

    res.render('xp', { 
      users,
      xpMultiplier: getXPMultiplier(),
      user: await client.users.fetch(req.session.userId)
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

    res.render('admins', { 
      admins,
      user: await client.users.fetch(req.session.userId)
    });
  });

  app.post('/admins/add', requireAuth, (req, res) => {
    const { userId } = req.body;
    addAdmin(userId);
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

    res.render('servers', { 
      servers,
      user: await client.users.fetch(req.session.userId)
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Dashboard rodando em http://0.0.0.0:${PORT}`);
  });
}
