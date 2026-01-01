
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// In a real app, ensure this is handled via a backend proxy to hide the key, 
// but for this demo we use the env variable as instructed.
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getShoppingAdvice = async (userQuery: string, availableProducts: Product[]): Promise<{ text: string; productIds: string[] }> => {
  if (!apiKey) {
    return {
      text: "I'm currently offline (API Key missing). Please browse our catalog manually!",
      productIds: []
    };
  }

  try {
    // Create a context string of available products
    // We limit this to top 20 to avoid context limit issues if the catalog is huge
    const productContext = availableProducts.slice(0, 20).map(p => 
      `ID: ${p.id}, Name: ${p.name}, Price: ₹${p.price}, Category: ${p.category}, Features: ${p.features.join(', ')}`
    ).join('\n');

    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `
      You are "BazaarBot", a trendy, Gen Z-focused shopping assistant for "Content Bazaar".
      Your tone is helpful, concise, and uses modern internet slang appropriately (but professionally).
      You help users find the best digital subscriptions.
      
      Here is our product catalog:
      ${productContext}

      Company Information:
      - Instagram: @contentbazaar.shop (https://instagram.com/contentbazaar.shop)
      - WhatsApp Channel: https://whatsapp.com/channel/0029VbBihmNGehEEQeZWj41S
      - Website: contentbazaar.in
      - Email: support@contentbazaar.in
      - Whatsapp support number: +91 97738 21268
      
      When a user asks a question:
      1. Analyze their needs.
      2. Recommend up to 3 specific products from the catalog if relevant.
      3. Explain why those products fit their need.
      4. If asked about social media, Instagram, WhatsApp, or contact information, provide the relevant links above.
      
      Return the response in JSON format with two fields:
      - "response": The text reply to the user.
      - "recommendedIds": An array of product IDs that match the recommendation.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: userQuery,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                response: { type: Type.STRING },
                recommendedIds: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const parsed = JSON.parse(resultText);
    return {
        text: parsed.response,
        productIds: parsed.recommendedIds || []
    };

  } catch (error) {
    return {
      text: "I'm having a bit of a glitch connecting to the mainframe. Try searching manually?",
      productIds: []
    };
  }
};
