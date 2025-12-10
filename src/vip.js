
import fs from 'fs';
import path from 'path';

const dataDir = 'data';
const vipFile = path.join(dataDir, 'vip.json');

// Planos VIP disponíveis
export const VIP_PLANS = {
  bronze: {
    name: 'Bronze',
    price: 5000,
    duration: 30 * 24 * 60 * 60 * 1000, // 30 dias
    benefits: {
      xpMultiplier: 1.5,
      dailyBonus: 25,
      colorRole: '#cd7f32',
      badge: '🥉',
      workCooldown: 120000, // 2 min (vs 5 min normal)
      workBonus: 1.2, // 20% a mais
      gambleBonus: 0.52, // 52% chance (vs 50%)
      exclusiveCommands: true
    }
  },
  silver: {
    name: 'Prata',
    price: 10000,
    duration: 30 * 24 * 60 * 60 * 1000,
    benefits: {
      xpMultiplier: 2,
      dailyBonus: 50,
      colorRole: '#c0c0c0',
      badge: '🥈',
      workCooldown: 90000, // 1.5 min
      workBonus: 1.5, // 50% a mais
      gambleBonus: 0.55, // 55% chance
      exclusiveCommands: true
    }
  },
  gold: {
    name: 'Ouro',
    price: 20000,
    duration: 30 * 24 * 60 * 60 * 1000,
    benefits: {
      xpMultiplier: 3,
      dailyBonus: 100,
      colorRole: '#ffd700',
      badge: '🥇',
      workCooldown: 60000, // 1 min
      workBonus: 2, // 100% a mais
      gambleBonus: 0.58, // 58% chance
      exclusiveCommands: true
    }
  },
  diamond: {
    name: 'Diamante',
    price: 50000,
    duration: 30 * 24 * 60 * 60 * 1000,
    benefits: {
      xpMultiplier: 5,
      dailyBonus: 250,
      colorRole: '#b9f2ff',
      badge: '💎',
      workCooldown: 30000, // 30 seg
      workBonus: 3, // 200% a mais
      gambleBonus: 0.62, // 62% chance
      exclusiveCommands: true
    }
  }
};

// Carregar dados VIP
function loadVIP() {
  if (fs.existsSync(vipFile)) {
    try {
      return JSON.parse(fs.readFileSync(vipFile, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Salvar dados VIP
function saveVIP(data) {
  fs.writeFileSync(vipFile, JSON.stringify(data, null, 2));
}

// Verificar se usuário tem VIP ativo
export function hasVIP(userId) {
  const data = loadVIP();
  const userVIP = data[userId];
  
  if (!userVIP) return null;
  
  const now = Date.now();
  if (now > userVIP.expiresAt) {
    // VIP expirado
    delete data[userId];
    saveVIP(data);
    return null;
  }
  
  return userVIP;
}

// Obter multiplicador de XP do VIP
export function getVIPXPMultiplier(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 1;
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.xpMultiplier || 1;
}

// Obter bônus de daily do VIP
export function getVIPDailyBonus(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 0;
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.dailyBonus || 0;
}

// Obter badge do VIP
export function getVIPBadge(userId) {
  const vip = hasVIP(userId);
  if (!vip) return '';
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.badge || '';
}

// Obter cooldown de work do VIP
export function getVIPWorkCooldown(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 300000; // 5 min padrão
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.workCooldown || 300000;
}

// Obter bônus de work do VIP
export function getVIPWorkBonus(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 1;
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.workBonus || 1;
}

// Obter bônus de gamble do VIP
export function getVIPGambleBonus(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 0.5; // 50% padrão
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.gambleBonus || 0.5;
}

// Obter cor do VIP
export function getVIPColor(userId) {
  const vip = hasVIP(userId);
  if (!vip) return '#0a0a0a';
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.colorRole || '#0a0a0a';
}

// Verificar se tem acesso a comandos exclusivos
export function hasVIPCommands(userId) {
  const vip = hasVIP(userId);
  if (!vip) return false;
  
  const plan = VIP_PLANS[vip.plan];
  return plan?.benefits.exclusiveCommands || false;
}

// Comprar VIP
export function purchaseVIP(userId, planName) {
  const plan = VIP_PLANS[planName];
  if (!plan) return { success: false, error: 'Plano VIP inválido!' };
  
  const data = loadVIP();
  const now = Date.now();
  
  // Se já tem VIP, adiciona tempo
  let expiresAt;
  if (data[userId] && data[userId].expiresAt > now) {
    expiresAt = data[userId].expiresAt + plan.duration;
  } else {
    expiresAt = now + plan.duration;
  }
  
  data[userId] = {
    plan: planName,
    purchasedAt: now,
    expiresAt: expiresAt
  };
  
  saveVIP(data);
  
  return { 
    success: true, 
    plan: plan.name,
    expiresAt: expiresAt
  };
}

// Remover VIP (admin)
export function removeVIP(userId) {
  const data = loadVIP();
  delete data[userId];
  saveVIP(data);
}

// Obter todos os VIPs ativos
export function getAllVIPs() {
  const data = loadVIP();
  const now = Date.now();
  const activeVIPs = {};
  
  for (const [userId, vipData] of Object.entries(data)) {
    if (vipData.expiresAt > now) {
      activeVIPs[userId] = vipData;
    }
  }
  
  return activeVIPs;
}

// Obter tempo restante do VIP
export function getVIPTimeRemaining(userId) {
  const vip = hasVIP(userId);
  if (!vip) return 0;
  
  return vip.expiresAt - Date.now();
}

// Formatar tempo restante
export function formatVIPTime(ms) {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}
