import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminsPath = path.join(__dirname, '../data/admins.json');

export function isAdmin(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    return data.adminUsers.some(admin => admin.userId === userId);
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

export function verifyAdminPassword(userId, password) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    const admin = data.adminUsers.find(admin => admin.userId === userId);
    return admin && admin.password === password;
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

export function addAdmin(userId, password = 'admin123') {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    if (!data.adminUsers.some(admin => admin.userId === userId)) {
      data.adminUsers.push({ userId, password });
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
    data.adminUsers = data.adminUsers.filter(admin => admin.userId !== userId);
    fs.writeFileSync(adminsPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao remover admin:', error);
    return false;
  }
}

export function getAdmins() {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    return data.adminUsers.map(admin => admin.userId) || [];
  } catch (error) {
    console.error('Erro ao obter admins:', error);
    return [];
  }
}
