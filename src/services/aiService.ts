import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (import.meta.env.VITE_MY_API_KEY || process.env.GEMINI_API_KEY) as string });

export interface FeedbackResult {
  score: number;
  feedback: string;
  transcript: string;
}

export async function analyzeEnglishAudio(audioBase64: string): Promise<FeedbackResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: "You are an expert English teacher. Analyze this audio recording of a student's homework. Provide a transcript, a score from 0-100, and constructive feedback on pronunciation, grammar, and fluency."
          },
          {
            inlineData: {
              mimeType: "audio/webm", // MediaRecorder in browser typically outputs webm
              data: audioBase64
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          transcript: { type: Type.STRING }
        },
        required: ["score", "feedback", "transcript"]
      }
    }
  });

  const content = response.text;
  if (!content) throw new Error("No feedback generated from AI");
  return JSON.parse(content) as FeedbackResult;
}
