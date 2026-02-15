import { GoogleGenAI, Type } from "@google/genai";

// Fix: Adhere to Gemini API guidelines by obtaining the API key exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiRewardSuggestion = async (taskDescription: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O projeto 'Mestres da Linguagem' premia alunos com moedas digitais simbólicas.
      Baseado nesta atividade: "${taskDescription}", sugira uma quantidade de moedas (1 a 100) 
      e uma mensagem motivacional curta em português.`,
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

    // Fix: Add a check for response.text to ensure it's not undefined before parsing.
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Received empty response from Gemini API.");
  } catch (error) {
    console.error("Gemini Error:", error);
    return { amount: 10, message: "Excelente progresso nos estudos!" };
  }
};