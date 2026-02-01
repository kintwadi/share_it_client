
import { GoogleGenAI } from "@google/genai";

export const generateDescription = async (itemName: string, category: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return `(AI Unavailable - Mock) A great ${itemName} perfect for your needs in the ${category} category.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a friendly, short (2 sentences), and trusting description for a neighborhood sharing platform for an item named "${itemName}" in the category "${category}".`,
    });
    
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};
