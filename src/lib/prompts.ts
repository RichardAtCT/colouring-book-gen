import type { AgeRange } from "@/types";

const AGE_COMPLEXITY: Record<AgeRange, string> = {
  "2-4":
    "Very simple shapes, extra thick bold outlines, minimal detail, large areas to colour",
  "5-7":
    "Simple but recognisable shapes, thick outlines, moderate detail, clear defined areas",
  "8-12":
    "Detailed illustration, medium-weight outlines, intricate patterns allowed",
};

export function buildSystemPrompt(
  userPrompt: string,
  ageRange: AgeRange
): string {
  const complexity = AGE_COMPLEXITY[ageRange];

  return `Children's colouring book page. Black line art on pure white background. Clean outlines only. No shading, no gradients, no grey tones, no colour fill, no watermarks. ${complexity}. Subject: ${userPrompt} Style: Friendly, age-appropriate cartoon illustration suitable for a printed colouring book. The image should fill the page with the subject centred.`;
}
