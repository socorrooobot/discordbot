import fs from 'fs';

const CONFIG_FILE = 'data/restartconfig.json';

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Erro ao ler config de restart:', error);
  }
  return { restartNotificationChannelId: null, restartReason: 'Atualização programada' };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Erro ao salvar config de restart:', error);
  }
}

export function setRestartChannel(channelId) {
  const config = getConfig();
  config.restartNotificationChannelId = channelId;
  config.lastRestartTime = new Date().toISOString();
  saveConfig(config);
}

export function getRestartChannel() {
  const config = getConfig();
  return config.restartNotificationChannelId;
}

export async function notifyRestart(client, reason = 'Atualização programada') {
  const config = getConfig();
  const channelId = config.restartNotificationChannelId;
  
  if (!channelId) return;
  
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return;
    
    const embed = {
      color: 0xFF6B6B,
      title: '⚠️ Bot em Manutenção',
      description: '🤖 A Miku Diva está sendo reinicializada para atualizações e melhorias!',
      fields: [
        { name: '📝 Motivo', value: reason, inline: false },
        { name: '⏱️ Tempo Estimado', value: '🕐 2-3 minutos offline', inline: false },
        { name: '✅ Status', value: 'O bot retornará em breve!', inline: false }
      ],
      footer: { text: 'Obrigado pela paciência! 💙' },
      timestamp: new Date().toISOString()
    };
    
    await channel.send({ embeds: [embed] });
    console.log('✅ Notificação de restart enviada!');
  } catch (error) {
    console.error('Erro ao enviar notificação de restart:', error);
  }
}
