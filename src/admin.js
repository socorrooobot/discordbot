import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminsPath = path.join(__dirname, '../data/admins.json');

export function isAdmin(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    return data.adminUsers.includes(userId);
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

export function addAdmin(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    if (!data.adminUsers.includes(userId)) {
      data.adminUsers.push(userId);
      fs.writeFileSync(adminsPath, JSON.stringify(data, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao adicionar admin:', error);
    return false;
  }
}

export function removeAdmin(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    data.adminUsers = data.adminUsers.filter(id => id !== userId);
    fs.writeFileSync(adminsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao remover admin:', error);
    return false;
  }
}
