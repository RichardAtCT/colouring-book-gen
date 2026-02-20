import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import OpenAI from "openai";
import { getDefaultUserId } from "@/lib/default-user";
import { calculateChatCost } from "@/lib/costs";

const schema = z.object({
  concept: z
    .string()
    .min(3, "Concept must be at least 3 characters")
    .max(200, "Concept must be under 200 characters"),
  ageRange: z.enum(["2-4", "5-7", "8-12"]),
  pageCount: z.number().int().min(5).max(20),
});

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI();
  }
  return _openai;
}

export async function POST(request: NextRequest) {
  await getDefaultUserId();

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { concept, ageRange, pageCount } = parsed.data;

  const ageDescriptions: Record<string, string> = {
    "2-4": "toddlers aged 2-4 (very simple shapes, bold outlines, minimal detail)",
    "5-7": "children aged 5-7 (moderate detail, clear outlines, fun elements)",
    "8-12": "children aged 8-12 (detailed scenes, intricate patterns, more complexity)",
  };

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a children's colouring book designer. Given a book concept, generate exactly ${pageCount} page descriptions and 1 cover description for a colouring book.

Each description should be a detailed prompt for generating black-and-white line art suitable for ${ageDescriptions[ageRange]}.

The cover should be a decorative illustration that represents the overall theme. Do NOT include any text in the cover description — text will be overlaid separately.

Each page should depict a different scene or aspect of the concept, telling a visual story that progresses through the book.

Respond with JSON in this exact format:
{
  "cover": { "title": "Cover", "prompt": "description of cover illustration" },
  "pages": [
    { "title": "short page title", "prompt": "detailed scene description" },
    ...
  ]
}

The pages array must have exactly ${pageCount} items. Each prompt should be 1-3 sentences describing the scene in detail.`,
        },
        {
          role: "user",
          content: `Create a colouring book about: ${concept}`,
        },
      ],
      temperature: 0.8,
    });

    if (completion.usage) {
      const chatCost = calculateChatCost("gpt-4o-mini", {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
      });
      console.log(
        `[generate-prompts] gpt-4o-mini cost: $${chatCost.toFixed(6)} ` +
          `(${completion.usage.prompt_tokens} in / ${completion.usage.completion_tokens} out)`
      );
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate prompts" },
        { status: 500 }
      );
    }

    const result = JSON.parse(content);

    // Add IDs to each item
    const cover = {
      id: crypto.randomUUID(),
      title: result.cover?.title ?? "Cover",
      prompt: result.cover?.prompt ?? "",
    };

    const pages = (result.pages ?? []).map(
      (page: { title: string; prompt: string }, index: number) => ({
        id: crypto.randomUUID(),
        pageNumber: index + 1,
        title: page.title ?? `Page ${index + 1}`,
        prompt: page.prompt ?? "",
      })
    );

    return NextResponse.json({ cover, pages });
  } catch (error) {
    console.error("Prompt generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate prompts" },
      { status: 500 }
    );
  }
}
