import fs from 'fs';
import path from 'path';
import { getMultiplier } from './multiplier.js';

const dataDir = 'data';
const economyFile = path.join(dataDir, 'economy.json');

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Carregar dados ou criar arquivo vazio
function loadEconomy() {
  if (fs.existsSync(economyFile)) {
    try {
      return JSON.parse(fs.readFileSync(economyFile, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Salvar dados
function saveEconomy(data) {
  fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
}

// Obter ou criar usuário
function getUser(userId) {
  const data = loadEconomy();
  if (!data[userId]) {
    data[userId] = {
      balance: 100, // Começa com 100 Akita Neru
      lastDaily: 0,
      inventory: {}
    };
    saveEconomy(data);
  }
  return data[userId];
}

// Atualizar usuário
function updateUser(userId, userData) {
  const data = loadEconomy();
  data[userId] = userData;
  saveEconomy(data);
}

// Obter saldo
export function getBalance(userId) {
  const user = getUser(userId);
  return user.balance;
}

// Adicionar moeda
export function addBalance(userId, amount) {
  const user = getUser(userId);
  user.balance += amount;
  updateUser(userId, user);
  return user.balance;
}

// Remover moeda
export function removeBalance(userId, amount) {
  const user = getUser(userId);
  if (user.balance < amount) return null;
  user.balance -= amount;
  updateUser(userId, user);
  return user.balance;
}

// Definir saldo direto (admin)
export function setBalance(userId, amount) {
  const user = getUser(userId);
  user.balance = amount;
  updateUser(userId, user);
  return user.balance;
}

// Transferir moeda
export function transfer(fromId, toId, amount) {
  const fromUser = getUser(fromId);
  const toUser = getUser(toId);
  
  if (fromUser.balance < amount) return null;
  
  fromUser.balance -= amount;
  toUser.balance += amount;
  
  updateUser(fromId, fromUser);
  updateUser(toId, toUser);
  
  return { fromBalance: fromUser.balance, toBalance: toUser.balance };
}

// Diário (daily)
export async function dailyReward(userId) {
  const user = getUser(userId);
  const now = Date.now();
  const lastDaily = user.lastDaily || 0;
  
  // Verificar se 24 horas passaram
  if (now - lastDaily < 86400000) {
    return null;
  }
  
  const baseReward = 50; // 50 Akita Neru base
  const multiplier = getMultiplier();
  
  // Bônus VIP
  let vipBonus = 0;
  try {
    const { getVIPDailyBonus } = await import('./vip.js');
    vipBonus = getVIPDailyBonus(userId);
  } catch (e) {
    // VIP não disponível
  }
  
  const reward = Math.floor(baseReward * multiplier) + vipBonus;
  
  user.balance += reward;
  user.lastDaily = now;
  updateUser(userId, user);
  
  return { reward, multiplier, vipBonus };
}

// Calcular quando o próximo daily estará disponível
export function getTimeUntilDaily(userId) {
  const user = getUser(userId);
  const now = Date.now();
  const lastDaily = user.lastDaily || 0;
  const timeElapsed = now - lastDaily;
  const dailyCooldown = 86400000; // 24 horas em ms
  
  if (timeElapsed >= dailyCooldown) {
    return 0; // Daily está disponível agora
  }
  
  return dailyCooldown - timeElapsed; // Tempo restante em ms
}

// Obter todos os usuários
export function getAllUsers() {
  return loadEconomy();
}

// Leaderboard
export function getLeaderboard(limit = 10) {
  const data = loadEconomy();
  return Object.entries(data)
    .map(([userId, user]) => ({ userId, balance: user.balance }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

// Sistema de trabalho (ganha moeda aleatória)
export async function work(userId) {
  const user = getUser(userId);
  const now = Date.now();
  const lastWork = user.lastWork || 0;
  
  // Obter cooldown VIP
  let workCooldown = 300000; // 5 min padrão
  let workBonus = 1;
  
  try {
    const { getVIPWorkCooldown, getVIPWorkBonus } = await import('./vip.js');
    workCooldown = getVIPWorkCooldown(userId);
    workBonus = getVIPWorkBonus(userId);
  } catch (e) {
    // VIP não disponível
  }
  
  // Verificar cooldown
  if (now - lastWork < workCooldown) {
    const timeLeft = workCooldown - (now - lastWork);
    return { error: true, timeLeft };
  }
  
  const baseEarnings = Math.floor(Math.random() * 30) + 10; // 10-40 Akita Neru
  const earnings = Math.floor(baseEarnings * workBonus);
  
  user.balance += earnings;
  user.lastWork = now;
  updateUser(userId, user);
  
  return { error: false, earnings, bonus: workBonus };
}

// Sistema de jogo (gambling)
export async function gamble(userId, amount) {
  const user = getUser(userId);
  
  if (user.balance < amount) return null;
  
  // Obter chance VIP
  let winChance = 0.5; // 50% padrão
  
  try {
    const { getVIPGambleBonus } = await import('./vip.js');
    winChance = getVIPGambleBonus(userId);
  } catch (e) {
    // VIP não disponível
  }
  
  const won = Math.random() < winChance;
  
  if (won) {
    user.balance += amount;
    updateUser(userId, user);
    return { won: true, earnings: amount, newBalance: user.balance, chance: winChance };
  } else {
    user.balance -= amount;
    updateUser(userId, user);
    return { won: false, loss: amount, newBalance: user.balance, chance: winChance };
  }
}
