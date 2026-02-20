import { generateImage as generateWithOpenAI } from "./openai";
import { generateImage as generateWithGemini } from "./gemini";
import type { QualityTier } from "@/types";
import type { TokenUsage } from "./costs";

export type Provider = "openai" | "gemini";

interface GenerateResult {
  imageBase64: string;
  provider: Provider;
  model: string;
  usage: TokenUsage | null;
}

export async function generateImage(
  prompt: string,
  quality: QualityTier,
  provider: Provider = "openai"
): Promise<GenerateResult> {
  if (provider === "gemini") {
    const result = await generateWithGemini(prompt, quality);
    return { ...result, provider: "gemini" };
  }
  const result = await generateWithOpenAI(prompt, quality);
  return { ...result, provider: "openai" };
}
