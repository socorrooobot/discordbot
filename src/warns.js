import fs from 'fs';
import path from 'path';

const WARNS_FILE = path.join(process.cwd(), 'data', 'warns.json');

function loadWarns() {
  try {
    if (!fs.existsSync(path.dirname(WARNS_FILE))) {
      fs.mkdirSync(path.dirname(WARNS_FILE), { recursive: true });
    }
    if (!fs.existsSync(WARNS_FILE)) {
      return {};
    }
    const data = fs.readFileSync(WARNS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar warns:', error);
    return {};
  }
}

function saveWarns(warns) {
  try {
    fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));
  } catch (error) {
    console.error('Erro ao salvar warns:', error);
  }
}

export function addWarn(userId, staffId, reason) {
  const warns = loadWarns();
  if (!warns[userId]) warns[userId] = [];
  
  warns[userId].push({
    staffId,
    reason,
    timestamp: new Date().toISOString()
  });
  
  saveWarns(warns);
  return warns[userId].length;
}

export function getWarns(userId) {
  const warns = loadWarns();
  return warns[userId] || [];
}

export function removeWarn(userId, index) {
  const warns = loadWarns();
  if (!warns[userId] || !warns[userId][index]) return false;
  
  warns[userId].splice(index, 1);
  if (warns[userId].length === 0) delete warns[userId];
  
  saveWarns(warns);
  return true;
}

export function clearWarns(userId) {
  const warns = loadWarns();
  if (!warns[userId]) return false;
  
  delete warns[userId];
  saveWarns(warns);
  return true;
}

