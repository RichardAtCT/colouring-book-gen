import OpenAI from "openai";
import type { QualityTier } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImage(
  prompt: string,
  quality: QualityTier
): Promise<{ imageBase64: string }> {
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality,
  });

  const imageData = response.data?.[0];

  if (!imageData?.b64_json) {
    throw new Error("No image data returned from OpenAI");
  }

  return { imageBase64: imageData.b64_json };
}
