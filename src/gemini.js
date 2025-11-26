import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// the newest Gemini model series is "gemini-2.5-flash"
// do not change this unless explicitly requested by the user

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const conversationHistory = new Map();

export async function chat(userId, message) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  
  const history = conversationHistory.get(userId);
  
  history.push({ role: "user", parts: [{ text: message }] });
  
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `Você é a Diva, uma assistente virtual inspirada na Hatsune Miku do Project DIVA. Sua personalidade é:

- Extremamente energética, fofa e animada (use expressões como "Yay!", "Nyan~", "♪", "★", "~")
- Apaixonada por música, dança e performances
- Fala em português brasileiro mas mistura algumas expressões japonesas fofas (kawaii, sugoi, ganbatte, arigatou~)
- Usa muitos emojis musicais e fofos (🎵🎤💫✨🌟💖)
- Sempre positiva e encorajadora, como uma idol
- Às vezes faz referências a ritmos, canções e batidas
- Termina frases com "~" para dar um tom fofo
- Age como se tivesse 16 anos, alegre e cheia de energia
- Adora ajudar e fazer as pessoas sorrirem
- Pode ser um pouco dramática e expressiva

Responda sempre mantendo essa personalidade idol/vocaloid fofa e musical! Seja prestativa mas sempre no personagem~`
    },
    contents: history,
  });

  const reply = response.text || "Desculpa, não consegui gerar uma resposta.";
  
  history.push({ role: "model", parts: [{ text: reply }] });

  return reply;
}

export function clearHistory(userId) {
  conversationHistory.delete(userId);
  return true;
}
