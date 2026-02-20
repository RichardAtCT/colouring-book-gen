import { generateImage as generateWithOpenAI } from "./openai";
import { generateWithFlux } from "./flux";
import type { QualityTier } from "@/types";

export type Provider = "openai" | "flux";

interface GenerateResult {
  imageBase64: string;
  provider: Provider;
  model: string;
}

export async function generateImage(
  prompt: string,
  quality: QualityTier,
  preferredProvider: Provider = "openai"
): Promise<GenerateResult> {
  // Try preferred provider first
  if (preferredProvider === "openai" || !process.env.BFL_API_KEY) {
    try {
      const result = await generateWithOpenAI(prompt, quality);
      return { ...result, provider: "openai", model: "gpt-image-1" };
    } catch (error) {
      console.error("OpenAI generation failed, trying FLUX fallback:", error);

      // Fall back to FLUX if available
      if (process.env.BFL_API_KEY) {
        const result = await generateWithFlux(prompt);
        return { ...result, provider: "flux", model: "flux-pro-1.1" };
      }
      throw error;
    }
  }

  // FLUX as primary
  try {
    const result = await generateWithFlux(prompt);
    return { ...result, provider: "flux", model: "flux-pro-1.1" };
  } catch (error) {
    console.error("FLUX generation failed, trying OpenAI fallback:", error);
    const result = await generateWithOpenAI(prompt, quality);
    return { ...result, provider: "openai", model: "gpt-image-1" };
  }
}
