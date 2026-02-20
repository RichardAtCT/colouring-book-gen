import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { buildSystemPrompt } from "@/lib/prompts";
import { generateImage } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rate-limit";

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
    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          code: "RATE_LIMIT",
        },
        {
          status: 429,
          headers: { "X-RateLimit-Remaining": String(remaining) },
        }
      );
    }

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

    // Generate the image
    const { imageBase64 } = await generateImage(fullPrompt, quality);

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    return NextResponse.json(
      {
        id: crypto.randomUUID(),
        imageUrl,
        prompt,
        ageRange,
        quality,
        createdAt: new Date().toISOString(),
      },
      {
        headers: { "X-RateLimit-Remaining": String(remaining) },
      }
    );
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
