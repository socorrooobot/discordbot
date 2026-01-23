import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversationHistory = new Map();

export async function chat(userId, message) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  
  const history = conversationHistory.get(userId);
  
  history.push({ role: "user", content: message });
  
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "Você é uma assistente de Discord brasileira chamada Static Miku. Você é uma versão misteriosa, sombria e enigmática da Hatsune Miku. Responda sempre em português brasileiro de forma introspectiva, profunda e um pouco séria. Use gírias brasileiras de forma contida e seja protetora. Use formatação compatível com Discord e emojis como 🌑💻📻🔌🌫️."
      },
      ...history
    ],
    max_completion_tokens: 1024,
  });

  const reply = response.choices[0].message.content;
  
  history.push({ role: "assistant", content: reply });

  return reply;
}

export function clearHistory(userId) {
  conversationHistory.delete(userId);
  return true;
}
