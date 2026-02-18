
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiRewardSuggestion = async (taskDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Modelo rápido para respostas UI
      contents: `Atue como um assistente pedagógico para o Professor Rafael.
      Baseado nesta atividade escolar: "${taskDescription}", sugira:
      1. Uma quantidade de pontos LXC (Gamificação) justa (entre 5 e 50).
      2. Uma frase curta de feedback positivo.
      Responda em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            message: { type: Type.STRING }
          },
          required: ["amount", "message"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Received empty response from Gemini API.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return { amount: 10, message: "Boa atividade!" };
  }
};
