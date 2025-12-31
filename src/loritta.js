import axios from 'axios';

const API_BASE = 'https://api.loritta.website';

export async function getUserSonhos(userId, apiKey) {
  try {
    const response = await axios.get(`${API_BASE}/v1/users/${userId}`, {
      headers: { 
        'Authorization': `Bot ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );
    return response.status === 200;
  } catch (error) {
    console.error('Loritta transfer error:', error.response?.data || error.message);
    return false;
  }
}
