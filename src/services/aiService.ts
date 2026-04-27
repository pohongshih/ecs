import { GoogleGenAI, Type } from "@google/genai";

// @ts-ignore
const ai = new GoogleGenAI({ apiKey: ((import.meta as any)?.env?.VITE_MY_API_KEY || process.env.GEMINI_API_KEY) as string });

export interface FeedbackResult {
  score: number;
  feedback: string;
  transcript: string;
}

export async function analyzeEnglishAudio(audioBase64: string, mimeType: string, homeworkTitle: string, homeworkDescription: string): Promise<FeedbackResult> {
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `You are a strict but fair expert English teacher. Analyze this audio recording of a student's homework. The student was asked to talk about the following topic:
Title: "${homeworkTitle}"
Description: "${homeworkDescription}"

Instructions:
1. Provide a precise transcript of what the student said. If the audio is silent, garbled, or completely empty, provide an empty transcript or state that it is inaudible.
2. Provide a score from 0-100. If the audio has no speech or does not match the topic AT ALL, score it very low (0-20).
3. Provide critical and constructive feedback. You MUST explicitly point out both strengths (if any) and weaknesses. Analyze pronunciation, grammar, vocabulary, and fluency. Address whether the student followed the assignment topic.`
          },
          {
            inlineData: {
              mimeType: mimeType || "audio/webm",
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
          score: { type: Type.NUMBER, description: "Score from 0 to 100" },
          feedback: { type: Type.STRING, description: "Detailed feedback with strengths and weaknesses" },
          transcript: { type: Type.STRING, description: "What the student said" }
        },
        required: ["score", "feedback", "transcript"]
      }
    }
  });

  const content = response.text;
  if (!content) throw new Error("No feedback generated from AI");
  return JSON.parse(content) as FeedbackResult;
}
