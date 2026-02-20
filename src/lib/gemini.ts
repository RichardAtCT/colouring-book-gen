import { GoogleGenAI } from "@google/genai";
import type { QualityTier } from "@/types";
import type { TokenUsage } from "./costs";

let _genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_genai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    _genai = new GoogleGenAI({ apiKey });
  }
  return _genai;
}

const MODEL = "gemini-2.5-flash-image";

export async function generateImage(
  prompt: string,
  _quality: QualityTier
): Promise<{ imageBase64: string; model: string; usage: TokenUsage | null }> {
  const genai = getClient();
  const response = await genai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find(
    (p: { inlineData?: { mimeType?: string; data?: string } }) =>
      p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data returned from Gemini");
  }

  return {
    imageBase64: imagePart.inlineData.data,
    model: MODEL,
    usage: null,
  };
}
