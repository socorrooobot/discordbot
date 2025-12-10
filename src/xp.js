import fs from 'fs';
import path from 'path';

const dataDir = 'data';
const xpFile = path.join(dataDir, 'xp.json');
const xpMultiplierFile = path.join(dataDir, 'xpmultiplier.json');

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Constantes
const XP_PER_MESSAGE = 10; // XP por mensagem
const XP_PER_LEVEL = 100; // XP necessário para próximo nível

// Carregar multiplicador de XP
function loadXPMultiplier() {
  if (fs.existsSync(xpMultiplierFile)) {
    try {
      return JSON.parse(fs.readFileSync(xpMultiplierFile, 'utf8'));
    } catch {
      return { multiplier: 1 };
    }
  }
  return { multiplier: 1 };
}

// Salvar multiplicador de XP
function saveXPMultiplier(data) {
  fs.writeFileSync(xpMultiplierFile, JSON.stringify(data, null, 2));
}

// Obter multiplicador de XP
export function getXPMultiplier() {
  const data = loadXPMultiplier();
  return data.multiplier || 1;
}

// Definir multiplicador de XP (admin)
export function setXPMultiplier(multiplier) {
  if (multiplier < 1 || multiplier > 10) {
    return false; // Limite de 1x a 10x
  }
  saveXPMultiplier({ multiplier });
  return true;
}

// Carregar dados
function loadXP() {
  if (fs.existsSync(xpFile)) {
    try {
      return JSON.parse(fs.readFileSync(xpFile, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Salvar dados
function saveXP(data) {
  fs.writeFileSync(xpFile, JSON.stringify(data, null, 2));
}

// Obter ou criar usuário
function getUser(userId) {
  const data = loadXP();
  if (!data[userId]) {
    data[userId] = {
      xp: 0,
      level: 1,
      totalXP: 0
    };
    saveXP(data);
  }
  return data[userId];
}

// Atualizar usuário
function updateUser(userId, userData) {
  const data = loadXP();
  data[userId] = userData;
  saveXP(data);
}

// Calcular nível baseado em XP total
function calculateLevel(totalXP) {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

// Calcular XP necessário para o nível atual
function getXPForLevel(level) {
  return (level - 1) * XP_PER_LEVEL;
}

// Calcular XP para o próximo nível
function getXPForNextLevel(level) {
  return level * XP_PER_LEVEL;
}

// Adicionar XP
export async function addXP(userId) {
  const user = getUser(userId);
  const oldLevel = user.level;
  
  // Importar multiplicador VIP dinamicamente
  let vipMultiplier = 1;
  try {
    const { getVIPXPMultiplier } = await import('./vip.js');
    vipMultiplier = getVIPXPMultiplier(userId);
  } catch (e) {
    // VIP não disponível
  }
  
  const baseMultiplier = getXPMultiplier();
  const multiplier = baseMultiplier * vipMultiplier;
  const xpGained = XP_PER_MESSAGE * multiplier;
  
  user.totalXP += xpGained;
  user.xp += xpGained;
  user.level = calculateLevel(user.totalXP);
  
  updateUser(userId, user);
  
  // Retornar se houve level up
  if (user.level > oldLevel) {
    return { leveledUp: true, newLevel: user.level, oldLevel, xpGained, multiplier };
  }
  
  return { leveledUp: false, level: user.level, xpGained, multiplier };
}

// Obter informações do usuário
export function getUserInfo(userId) {
  const user = getUser(userId);
  const xpForCurrentLevel = getXPForLevel(user.level);
  const xpForNextLevel = getXPForNextLevel(user.level);
  const xpInCurrentLevel = user.totalXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  return {
    xp: xpInCurrentLevel,
    xpNeeded: xpNeededForNextLevel,
    level: user.level,
    totalXP: user.totalXP,
    progressBar: createProgressBar(xpInCurrentLevel, xpNeededForNextLevel)
  };
}

// Criar barra de progresso
function createProgressBar(current, max) {
  const percentage = (current / max) * 100;
  const filled = Math.floor(percentage / 5);
  const empty = 20 - filled;
  
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.floor(percentage)}%`;
}

// Leaderboard de XP
export function getXPLeaderboard(limit = 10) {
  const data = loadXP();
  return Object.entries(data)
    .map(([userId, user]) => ({ userId, level: user.level, totalXP: user.totalXP }))
    .sort((a, b) => b.totalXP - a.totalXP)
    .slice(0, limit);
}

// Adicionar XP direto (admin)
export function addXPDirect(userId, amount) {
  const user = getUser(userId);
  user.totalXP += amount;
  user.level = calculateLevel(user.totalXP);
  updateUser(userId, user);
  return user;
}

// Remover XP direto (admin)
export function removeXPDirect(userId, amount) {
  const user = getUser(userId);
  if (user.totalXP < amount) return null;
  user.totalXP -= amount;
  user.level = calculateLevel(user.totalXP);
  updateUser(userId, user);
  return user;
}

// Obter rank de um usuário
export function getUserRank(userId) {
  const leaderboard = getXPLeaderboard(1000);
  const rank = leaderboard.findIndex(entry => entry.userId === userId) + 1;
  return rank || 'N/A';
}

// Obter todos os usuários com XP (para dashboard)
export function getAllUsers() {
  return loadXP();
}
