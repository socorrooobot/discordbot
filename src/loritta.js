import axios from 'axios';

const API_BASE = 'https://api.loritta.website';

export async function getUserSonhos(userId, apiKey) {
  try {
    const response = await axios.get(`${API_BASE}/v1/users/${userId}`, {
      headers: { 
        'Authorization': `Bot ${apiKey}`,
        'User-Agent': 'DivaBot (https://replit.com, 1.0.0)'
      }
    });
    return response.data.sonhos;
  } catch (error) {
    console.error('Error fetching Loritta user:', error.response?.data || error.message);
    return null;
  }
}

export async function requestSonhosTransfer(guildId, channelId, userId, amount, reason, apiKey) {
  try {
    const response = await axios.post(
      `${API_BASE}/v1/guilds/${guildId}/channels/${channelId}/sonhos/sonhos-request`,
      {
        userId: userId,
        amount: amount,
        reason: reason
      },
      {
        headers: {
          'Authorization': `Bot ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DivaBot (https://replit.com, 1.0.0)'
        }
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error('Loritta transfer error:', error.response?.data || error.message);
    return false;
  }
}
