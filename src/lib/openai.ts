import OpenAI from "openai";
import type { QualityTier } from "@/types";
import type { TokenUsage } from "./costs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL_FOR_QUALITY: Record<QualityTier, string> = {
  low: "gpt-image-1-mini",
  medium: "gpt-image-1",
  high: "gpt-image-1.5",
};

export async function generateImage(
  prompt: string,
  quality: QualityTier
): Promise<{ imageBase64: string; model: string; usage: TokenUsage | null }> {
  const model = MODEL_FOR_QUALITY[quality];

  const response = await openai.images.generate({
    model,
    prompt,
    n: 1,
    size: "1024x1024",
    quality,
  });

  const imageData = response.data?.[0];

  if (!imageData?.b64_json) {
    throw new Error("No image data returned from OpenAI");
  }

  const usage =
    response.usage?.input_tokens != null
      ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens ?? 0,
        }
      : null;

  return { imageBase64: imageData.b64_json, model, usage };
}
