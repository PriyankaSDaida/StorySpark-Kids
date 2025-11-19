import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Story, ChatMessage } from '../types';

// Initialize Gemini Client
// NOTE: The API key is injected automatically into process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a children's story with pagination and image prompts using gemini-3-pro-preview.
 */
export const generateStory = async (topic: string): Promise<Story> => {
  const prompt = `Write a children's story about: "${topic}". 
  The story should be suitable for kids aged 3-8. 
  Split the story into 4-6 pages. 
  For each page, provide the story text and a detailed description for an illustration that matches the text.
  Return the result as JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the story" },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pageNumber: { type: Type.INTEGER },
                text: { type: Type.STRING, description: "The text for this page of the story (approx 2-3 sentences)" },
                imagePrompt: { type: Type.STRING, description: "A detailed visual description of the scene for an image generator. Cute, colorful style." }
              },
              required: ["pageNumber", "text", "imagePrompt"]
            }
          }
        },
        required: ["title", "pages"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No story generated");
  return JSON.parse(jsonText) as Story;
};

/**
 * Generates an image using imagen-4.0-generate-001.
 */
export const generateIllustration = async (prompt: string): Promise<string> => {
  // Adding style modifiers to the prompt for consistent kid-friendly art
  const fullPrompt = `Children's book illustration, vibrant colors, soft shapes, cute style: ${prompt}`;
  
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: fullPrompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '1:1',
      outputMimeType: 'image/jpeg'
    }
  });

  const base64Image = response.generatedImages[0]?.image.imageBytes;
  if (!base64Image) throw new Error("Failed to generate image");
  
  return `data:image/jpeg;base64,${base64Image}`;
};

/**
 * Generates speech using gemini-2.5-flash-preview-tts.
 * Returns base64 encoded PCM audio.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually a good, clear voice
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");
  
  return base64Audio;
};

/**
 * Chat with Gemini using gemini-3-pro-preview
 */
export const sendChatMessage = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  // Construct history for the chat session
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
        systemInstruction: "You are a friendly, helpful, and safe AI companion for children. Keep answers simple, encouraging, and educational. Avoid complex jargon.",
    },
    history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }))
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "I'm having trouble thinking of an answer right now.";
};
