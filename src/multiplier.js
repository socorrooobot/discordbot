
import fs from 'fs';
import path from 'path';

const dataDir = 'data';
const multiplierFile = path.join(dataDir, 'multiplier.json');

// Criar diretório se não existir
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Carregar configuração de multiplicador
function loadMultiplier() {
  if (fs.existsSync(multiplierFile)) {
    try {
      return JSON.parse(fs.readFileSync(multiplierFile, 'utf8'));
    } catch {
      return { multiplier: 1 };
    }
  }
  return { multiplier: 1 };
}

// Salvar configuração de multiplicador
function saveMultiplier(data) {
  fs.writeFileSync(multiplierFile, JSON.stringify(data, null, 2));
}

// Obter multiplicador atual
export function getMultiplier() {
  const data = loadMultiplier();
  return data.multiplier || 1;
}

// Definir multiplicador (admin)
export function setMultiplier(multiplier) {
  if (multiplier < 1 || multiplier > 10) {
    return false; // Limite de 1x a 10x
  }
  saveMultiplier({ multiplier });
  return true;
}
