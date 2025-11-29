import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Singleton instance
let genAI: GoogleGenAI | null = null;
const getAI = () => {
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  }
  return genAI;
};

// --- CHAT & ANALYSIS ---

interface ChatOptions {
  history: { role: string; parts: any[] }[];
  message: string;
  image?: string; // base64
  useThinking?: boolean;
  useSearch?: boolean;
  onStream: (text: string) => void;
}

export const sendMessage = async ({
  history,
  message,
  image,
  useThinking,
  useSearch,
  onStream
}: ChatOptions) => {
  const ai = getAI();
  
  // Model selection logic based on complexity/features
  let modelName = 'gemini-2.5-flash';
  let config: any = {};
  
  if (useThinking) {
    modelName = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 32768 }; // Max budget
    // Explicitly do NOT set maxOutputTokens for thinking
  } else if (useSearch) {
    modelName = 'gemini-2.5-flash';
    config.tools = [{ googleSearch: {} }];
  } else {
    // Default standard chat
    modelName = 'gemini-3-pro-preview'; // Smart default for "Gemini Intelligence"
  }

  // Construct content
  const userParts: any[] = [{ text: message }];
  if (image) {
    // Strip data URI prefix if present
    const base64Data = image.split(',')[1] || image;
    userParts.unshift({
      inlineData: {
        mimeType: 'image/png', // Assuming PNG from canvas
        data: base64Data
      }
    });
  }

  try {
    const chatSession = ai.chats.create({
      model: modelName,
      config: config,
      history: history, // Pass history if maintaining context
    });

    const result = await chatSession.sendMessageStream({
        parts: userParts
    } as any); // Type assertion needed due to SDK strictness vs convenience

    let fullText = '';
    let groundingChunks: any[] = [];

    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onStream(fullText);
      }
      if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
      }
    }

    return { text: fullText, groundingChunks };

  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

// --- IMAGE EDITING (2.5 Flash Image) ---

export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAI();
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    // Check for image in response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null; // No image generated
  } catch (error) {
    console.error("Image edit error:", error);
    throw error;
  }
};

// --- IMAGE GENERATION (3 Pro Image) ---

export const generateImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K', aspectRatio: string = "1:1") => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: aspectRatio
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};
