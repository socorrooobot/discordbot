import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blacklistPath = path.join(__dirname, '../data/blacklist.json');

export function isBlacklisted(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
    return data.blacklistedUsers.includes(userId);
  } catch (error) {
    console.error('Erro ao ler blacklist:', error);
    return false;
  }
}

export function addToBlacklist(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
    if (!data.blacklistedUsers.includes(userId)) {
      data.blacklistedUsers.push(userId);
      fs.writeFileSync(blacklistPath, JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao adicionar à blacklist:', error);
    return false;
  }
}

export function removeFromBlacklist(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(blacklistPath, 'utf8'));
    data.blacklistedUsers = data.blacklistedUsers.filter(id => id !== userId);
    fs.writeFileSync(blacklistPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao remover da blacklist:', error);
    return false;
  }
}
