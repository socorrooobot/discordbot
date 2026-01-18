import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminsPath = path.join(__dirname, '../data/admins.json');

export function isAdmin(userId) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    return data.adminUsers.some(admin => String(admin.userId) === String(userId));
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

export function verifyAdminPassword(userId, password) {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    const admin = data.adminUsers.find(admin => String(admin.userId) === String(userId));
    return admin && String(admin.password) === String(password);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

export function addAdmin(userId, password = 'admin123') {
  try {
    const data = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    const existingIndex = data.adminUsers.findIndex(admin => String(admin.userId) === String(userId));
    if (existingIndex !== -1) {
      data.adminUsers[existingIndex].password = password;
    } else {
      data.adminUsers.push({ userId: String(userId), password: String(password) });
    }
    fs.writeFileSync(adminsPath, JSON.stringify(data, null, 2));
    return true;
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
