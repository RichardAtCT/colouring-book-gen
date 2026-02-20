import { generateImage as generateWithOpenAI } from "./openai";
import type { QualityTier } from "@/types";
import type { TokenUsage } from "./costs";

export type Provider = "openai";

interface GenerateResult {
  imageBase64: string;
  provider: Provider;
  model: string;
  usage: TokenUsage | null;
}

export async function generateImage(
  prompt: string,
  quality: QualityTier
): Promise<GenerateResult> {
  const result = await generateWithOpenAI(prompt, quality);
  return { ...result, provider: "openai" };
}
