import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/lib/db";
import { generations } from "@/lib/db/schema";
import { buildSystemPrompt } from "@/lib/prompts";
import { generateImage } from "@/lib/generate-image";
import { uploadImage, generateImageKey } from "@/lib/storage";
import { getDefaultUserId } from "@/lib/default-user";
import { calculateImageCost } from "@/lib/costs";

const generateSchema = z.object({
  prompt: z
    .string()
    .min(3, "Prompt must be at least 3 characters")
    .max(500, "Prompt must be under 500 characters"),
  ageRange: z.enum(["2-4", "5-7", "8-12"]),
  quality: z.enum(["low", "medium", "high"]).default("low"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getDefaultUserId();

    // Parse and validate request body
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid input",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const { prompt, ageRange, quality } = parsed.data;

    // Build the full prompt with system instructions
    const fullPrompt = buildSystemPrompt(prompt, ageRange);

    // Generate the image (with automatic provider fallback)
    const generationStart = Date.now();
    const { imageBase64, provider, model, usage } = await generateImage(fullPrompt, quality);
    const durationMs = Date.now() - generationStart;

    const generationId = crypto.randomUUID();
    let imageUrl = `data:image/png;base64,${imageBase64}`;
    let thumbnailUrl: string | null = null;

    try {
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const key = generateImageKey(generationId);
      imageUrl = await uploadImage(imageBuffer, key);

      const thumbKey = generateImageKey(generationId, "_thumb");
      thumbnailUrl = await uploadImage(imageBuffer, thumbKey);
    } catch (storageError) {
      console.error("Storage upload failed:", storageError);
      imageUrl = `data:image/png;base64,${imageBase64}`;
    }

    // Compute cost from actual token usage when available
    const costUsd = usage ? calculateImageCost(model, usage) : 0;

    // Save generation record
    await db.insert(generations).values({
      id: generationId,
      userId,
      prompt,
      systemPrompt: fullPrompt,
      ageRange,
      provider,
      model,
      quality,
      imageUrl,
      thumbnailUrl,
      width: 1024,
      height: 1024,
      costUsd,
      inputTokens: usage?.inputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      durationMs,
      status: "completed",
    });

    return NextResponse.json({
      id: generationId,
      imageUrl,
      thumbnailUrl,
      prompt,
      ageRange,
      quality,
      costUsd,
      durationMs,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Generation failed:", error);

    const message =
      error instanceof Error ? error.message : "Image generation failed";

    return NextResponse.json(
      { error: message, code: "GENERATION_FAILED" },
      { status: 500 }
    );
  }
}
