import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, generations } from "@/lib/db/schema";
import { buildSystemPrompt } from "@/lib/prompts";
import { generateImage } from "@/lib/generate-image";
import { uploadImage, generateImageKey } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

const PLAN_LIMITS = {
  free: { daily: 5, monthly: 30, qualities: ["low"] },
  pro: { daily: 30, monthly: 500, qualities: ["low", "medium"] },
  creator: { daily: 100, monthly: 2000, qualities: ["low", "medium", "high"] },
} as const;

const COST_PER_QUALITY: Record<string, number> = {
  low: 0.005,
  medium: 0.04,
  high: 0.17,
};

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
    // Check authentication
    const session = await auth();

    // IP-based rate limiting for unauthenticated users
    if (!session?.user?.id) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      const { allowed } = checkRateLimit(ip);

      if (!allowed) {
        return NextResponse.json(
          {
            error:
              "Rate limit exceeded. Sign in for higher limits.",
            code: "RATE_LIMIT",
          },
          { status: 429 }
        );
      }
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

    // Check plan-based limits for authenticated users
    let userRecord = null;
    if (session?.user?.id) {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      userRecord = results[0];

      if (userRecord) {
        const limits = PLAN_LIMITS[userRecord.plan as keyof typeof PLAN_LIMITS];

        if (!(limits.qualities as readonly string[]).includes(quality)) {
          return NextResponse.json(
            {
              error: `${quality} quality is not available on your plan. Upgrade to access it.`,
              code: "RATE_LIMIT",
            },
            { status: 403 }
          );
        }

        if (userRecord.generationsToday >= limits.daily) {
          return NextResponse.json(
            { error: "Daily generation limit reached.", code: "RATE_LIMIT" },
            { status: 429 }
          );
        }

        if (userRecord.generationsThisMonth >= limits.monthly) {
          return NextResponse.json(
            { error: "Monthly generation limit reached.", code: "RATE_LIMIT" },
            { status: 429 }
          );
        }
      }
    }

    // Build the full prompt with system instructions
    const fullPrompt = buildSystemPrompt(prompt, ageRange);

    // Generate the image (with automatic provider fallback)
    const { imageBase64, provider, model } = await generateImage(fullPrompt, quality);

    const generationId = crypto.randomUUID();
    let imageUrl = `data:image/png;base64,${imageBase64}`;
    let thumbnailUrl: string | null = null;

    // Persist to storage and DB if user is authenticated
    if (session?.user?.id) {
      try {
        const imageBuffer = Buffer.from(imageBase64, "base64");
        const key = generateImageKey(generationId);
        imageUrl = await uploadImage(imageBuffer, key);

        const thumbKey = generateImageKey(generationId, "_thumb");
        thumbnailUrl = await uploadImage(imageBuffer, thumbKey);
      } catch (storageError) {
        // If storage fails, fall back to base64 data URL
        console.error("Storage upload failed:", storageError);
        imageUrl = `data:image/png;base64,${imageBase64}`;
      }

      // Save generation record
      await db.insert(generations).values({
        id: generationId,
        userId: session.user.id,
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
        costUsd: COST_PER_QUALITY[quality] ?? 0,
        status: "completed",
      });

      // Update user generation counters
      await db
        .update(users)
        .set({
          generationsToday: sql`${users.generationsToday} + 1`,
          generationsThisMonth: sql`${users.generationsThisMonth} + 1`,
        })
        .where(eq(users.id, session.user.id));
    }

    return NextResponse.json({
      id: generationId,
      imageUrl,
      thumbnailUrl,
      prompt,
      ageRange,
      quality,
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
