import fs from 'fs';
import path from 'path';

const dataDir = 'data';
const afkFile = path.join(dataDir, 'afk.json');

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Carregar dados
function loadAFK() {
  if (fs.existsSync(afkFile)) {
    try {
      return JSON.parse(fs.readFileSync(afkFile, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

// Salvar dados
function saveAFK(data) {
  fs.writeFileSync(afkFile, JSON.stringify(data, null, 2));
}

// Marcar como AFK
export function setAFK(userId, reason) {
  const data = loadAFK();
  data[userId] = {
    reason,
    timestamp: Date.now()
  };
  saveAFK(data);
}

// Remover AFK
export function removeAFK(userId) {
  const data = loadAFK();
  delete data[userId];
  saveAFK(data);
}

// Verificar se está AFK
export function isAFK(userId) {
  const data = loadAFK();
  return data[userId] || null;
}

// Obter todos os usuários AFK
export function getAllAFK() {
  return loadAFK();
}
