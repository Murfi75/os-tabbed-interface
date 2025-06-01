import { GoogleGenAI, Chat, GenerateContentResponse, Content } from '@google/genai';
import { GEMINI_IMAGE_GEN_MODEL, ADMIN_API_KEY_LOCAL_STORAGE_KEY } from '../constants';

let _aiInstance: GoogleGenAI | null = null;
let _activeApiKey: string | undefined = undefined; // Stores the key string that was used to initialize _aiInstance

const resolveApiKey = (): string | undefined => {
  const adminKey = localStorage.getItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY);
  if (adminKey) {
    return adminKey;
  }
  // IMPORTANT: process.env.API_KEY is typically set during build time or on the server.
  // In a purely client-side context without a build process that injects env vars,
  // process.env.API_KEY might be undefined.
  // For this example, we assume it *could* be available (e.g., via a build step or a global variable).
  // If it's consistently undefined, the Admin Panel key becomes essential.
  const envKey = process.env.API_KEY; 
  return envKey;
};

const getAiInstance = (): GoogleGenAI => {
  const currentResolvedKey = resolveApiKey();

  if (!_aiInstance || _activeApiKey !== currentResolvedKey) {
    if (!currentResolvedKey) {
      console.error("Gemini API Key is not available. Please set it in the Admin Panel or ensure process.env.API_KEY is configured.");
      throw new Error("API Key not configured. Check Admin Panel or environment variables.");
    }
    try {
      _aiInstance = new GoogleGenAI({ apiKey: currentResolvedKey });
      _activeApiKey = currentResolvedKey;
      console.info(`Gemini AI client initialized/re-initialized. Key source: ${geminiService.getApiKeySource()}`);
    } catch (e: any) {
      console.error("Failed to initialize GoogleGenAI with API key:", e);
      // If admin key caused failure, clearing it might be an option, but could lead to loops.
      // For now, let the error propagate.
      _aiInstance = null; // Prevent using a faulty instance
      _activeApiKey = undefined;
      throw new Error(`Failed to initialize AI with the provided key: ${e.message}. Please verify the key.`);
    }
  }
  return _aiInstance;
};

// Call this function if the admin changes the key to force re-evaluation,
// or rely on the next API call to pick up the change.
// Forcing re-evaluation immediately gives quicker feedback on key validity.
const forceReinitializeAiInstance = () => {
    _aiInstance = null; // Clears the current instance
    _activeApiKey = undefined; // Clears the active key
    // The next call to getAiInstance() will perform re-initialization
    try {
        getAiInstance(); // Attempt re-initialization immediately
    } catch (e) {
        // Error already logged by getAiInstance, AdminView should show this error
    }
}

export const geminiService = {
  initChat: (modelName: string, systemInstruction?: string): Chat => {
    const ai = getAiInstance();
    return ai.chats.create({
      model: modelName,
      config: {
        systemInstruction: systemInstruction,
      },
    });
  },

  initChatWithHistory: (modelName: string, history: Content[], systemInstruction?: string): Chat => {
    const ai = getAiInstance();
    return ai.chats.create({
      model: modelName,
      history: history,
      config: {
        systemInstruction: systemInstruction,
      },
    });
  },

  streamMessage: async (
    chat: Chat,
    message: string,
    onChunk: (chunkText: string) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> => {
    try {
      getAiInstance(); // Ensures AI is initialized with the current key
      const result = await chat.sendMessageStream({ message }); // chat object holds its own model config
      for await (const chunk of result) {
        if (chunk && typeof chunk.text === 'string') {
          onChunk(chunk.text);
        }
      }
      onComplete();
    } catch (error: any) {
      console.error('Gemini API streaming error:', error);
      onError(error instanceof Error ? error : new Error('An unknown error occurred during streaming.'));
      onComplete(); 
    }
  },

  generateImage: async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: "SQUARE" | "PORTRAIT" | "LANDSCAPE",
    negativePrompt?: string
  ): Promise<string[] | null> => {
    const ai = getAiInstance();
    try {
      const imageConfig: {
          numberOfImages: number;
          outputMimeType: "image/jpeg" | "image/png";
          aspectRatio: "SQUARE" | "PORTRAIT" | "LANDSCAPE";
          negativePrompt?: string;
      } = {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
      };

      if (negativePrompt && negativePrompt.trim() !== "") {
          imageConfig.negativePrompt = negativePrompt.trim();
      }

      const response = await ai.models.generateImages({
        model: GEMINI_IMAGE_GEN_MODEL,
        prompt: prompt,
        config: imageConfig,
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const imageBytesArray = response.generatedImages
          .map(img => img.image?.imageBytes)
          .filter(bytes => bytes != null);
        return imageBytesArray.length > 0 ? imageBytesArray as string[] : null;
      }
      return null;
    } catch (error: any) {
      console.error('Gemini API image generation error:', error);
      if (error.message) {
        throw new Error(`Image generation failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during image generation.');
    }
  },

  getImageGenModelName: (): string => {
    return GEMINI_IMAGE_GEN_MODEL;
  },

  getApiKeySource: (): 'Admin' | 'Environment' | 'None' => {
    if (localStorage.getItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY)) {
      return 'Admin';
    }
    if (process.env.API_KEY) {
      return 'Environment';
    }
    return 'None';
  },
  
  // Expose for Admin Panel to trigger re-check after key save/clear
  triggerKeyReInitialization: forceReinitializeAiInstance 
};