
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const autorolePath = path.join(__dirname, '../data/autorole.json');

function loadAutoRoles() {
  try {
    if (!fs.existsSync(autorolePath)) {
      fs.writeFileSync(autorolePath, JSON.stringify({}, null, 2));
      return {};
    }
    return JSON.parse(fs.readFileSync(autorolePath, 'utf8'));
  } catch (error) {
    console.error('Erro ao carregar autoroles:', error);
    return {};
  }
}

function saveAutoRoles(data) {
  try {
    fs.writeFileSync(autorolePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao salvar autoroles:', error);
  }
}

export function setAutoRole(guildId, roleId) {
  const autoroles = loadAutoRoles();
  autoroles[guildId] = roleId;
  saveAutoRoles(autoroles);
}

export function getAutoRole(guildId) {
  const autoroles = loadAutoRoles();
  return autoroles[guildId] || null;
}

export function removeAutoRole(guildId) {
  const autoroles = loadAutoRoles();
  delete autoroles[guildId];
  saveAutoRoles(autoroles);
}

export async function applyAutoRole(member) {
  const roleId = getAutoRole(member.guild.id);
  
  if (!roleId) {
    return false;
  }

  try {
    const role = await member.guild.roles.fetch(roleId);
    if (role) {
      await member.roles.add(role);
      console.log(`✅ Auto role aplicado para ${member.user.tag}: ${role.name}`);
      return true;
    }
  } catch (error) {
    console.error('Erro ao aplicar autorole:', error);
  }
  
  return false;
}
