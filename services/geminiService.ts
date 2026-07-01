import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { AnalysisResult } from "../types";

// Primary model as requested, with fallback to Flash for robustness
const PRO_MODEL = "gemini-3-pro-preview";
const FLASH_MODEL = "gemini-2.5-flash";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found in environment variables");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateReply = async (
    mode: string,
    gender: string,
    language: string,
    stage: string,
    contextOrImage: { 
        textContext?: any, 
        image?: string,
        additionalContext?: string,
        conversationHistory?: string[]
    }
): Promise<AnalysisResult> => {
    const ai = getClient();
    
    // Construct the user prompt based on inputs
    let promptText = `
    Analyze this request and generate a reply.
    
    CONTEXT:
    - Chatting with: ${gender}
    - Selected Mode: ${mode}
    - Conversation Stage: ${stage}
    - OUTPUT LANGUAGE: ${language}
    `;

    if (language === 'Hinglish') {
        promptText += `
        IMPORTANT: The user wants "Hinglish" output. This means using Hindi words written in English (Roman) script, mixed with English naturally. Example: "Kya plan hai aaj?" or "Bas chill kar raha hu". Do NOT use Devanagari script.
        `;
    } else if (language === 'Hindi') {
        promptText += `
        IMPORTANT: The user wants "Hindi" output. Use Devanagari script. Example: "क्या चल रहा है?".
        `;
    } else if (language === 'English-Assamese') {
        promptText += `
        IMPORTANT: The user wants "English-Assamese" output. This means using Assamese words written in English (Roman) script, mixed with English naturally (often called "Asomish" or Romanized Assamese). 
        Examples: 
        - "Ki khobor?" (How are you?)
        - "Vle asa?" (Are you good?)
        - "Clg ketiya jaba?" (When will you go to college?)
        Do NOT use Assamese script. Use common chat shortcuts used in Assam.
        `;
    }

    if (contextOrImage.textContext) {
        promptText += `
        - Relationship Context: ${JSON.stringify(contextOrImage.textContext)}
        `;
    }

    if (contextOrImage.additionalContext) {
        promptText += `
        - Additional User Notes: ${contextOrImage.additionalContext}
        `;
    }

    if (contextOrImage.conversationHistory && contextOrImage.conversationHistory.length > 0) {
        promptText += `
        =================================================
        RECENT CONVERSATION HISTORY (Since last analysis):
        ${contextOrImage.conversationHistory.join('\n')}
        =================================================
        NOTE: The conversation history above is the MOST RECENT exchange. Prioritize this over the screenshot if they conflict.
        `;
    }

    if (contextOrImage.image) {
        promptText += `
        - The user has provided a screenshot of the conversation. Analyze the image to understand the context, tone, and relationship dynamics. If "RECENT CONVERSATION HISTORY" is provided above, treat the screenshot as the background context leading up to that history.
        `;
    }

    promptText += `
    Based on the above, generate a reply suggestion JSON object as defined in the system instructions. Ensure the "suggestedReply" and "alternatives" are in ${language}.
    `;

    const parts: any[] = [{ text: promptText }];

    if (contextOrImage.image) {
        // Correctly extract the MIME type and data from the Data URL
        const match = contextOrImage.image.match(/^data:(image\/\w+);base64,(.+)$/);
        
        if (match) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
        } else {
            // Fallback for raw base64 or unexpected format
            const base64Data = contextOrImage.image.replace(/^data:image\/\w+;base64,/, "");
            parts.push({
                inlineData: {
                    mimeType: "image/png", 
                    data: base64Data
                }
            });
        }
    }

    const commonConfig = {
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestedReply: { type: Type.STRING },
                    whyItWorks: { type: Type.STRING },
                    alternatives: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    vibeCheck: { type: Type.STRING }
                },
                required: ["suggestedReply", "whyItWorks", "alternatives", "vibeCheck"]
            }
        },
        contents: {
            role: "user",
            parts: parts
        }
    };

    try {
        // Attempt with the Pro model first
        const response = await ai.models.generateContent({
            model: PRO_MODEL,
            ...commonConfig
        });

        const text = response.text;
        if (!text) {
            throw new Error("Empty response from Gemini Pro");
        }

        return JSON.parse(text) as AnalysisResult;

    } catch (error) {
        console.warn("Gemini Pro failed, attempting fallback to Flash:", error);
        
        try {
            // Fallback to Flash model
            const fallbackResponse = await ai.models.generateContent({
                model: FLASH_MODEL,
                ...commonConfig
            });

            const text = fallbackResponse.text;
            if (!text) {
                throw new Error("Empty response from Gemini Flash");
            }

            return JSON.parse(text) as AnalysisResult;

        } catch (fallbackError: any) {
            console.error("Gemini Fallback Error:", fallbackError);
            throw new Error("Failed to generate reply. Please try again. " + (fallbackError.message || error));
        }
    }
};