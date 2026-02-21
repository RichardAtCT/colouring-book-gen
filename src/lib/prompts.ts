import type { AgeRange } from "@/types";

export const AGE_COMPLEXITY: Record<AgeRange, string> = {
  "2-4":
    "Very simple shapes, extra thick bold outlines, minimal detail, large areas to colour. Suitable for toddlers.",
  "5-7":
    "Simple but recognisable shapes, thick outlines, moderate detail, clear defined areas. Suitable for young children.",
  "8-12":
    "More detailed illustration, medium-weight outlines, intricate patterns allowed. Suitable for older children.",
};

export const STYLE_INSTRUCTIONS = [
  "Children's colouring book page.",
  "Black-and-white line art with no shading, no grayscale, and no colour.",
  "Minimal, cartoonish style. Clean, bold outlines. Avoid intricate detail or fine textures.",
  "The background should be mostly blank or very simple, to leave room for colouring.",
  "Avoid any filled areas — everything should be outlined only.",
  "Do not include realistic rendering, gradients, or 3D effects.",
  "If any text appears in the image, it must be simple, outlined, cartoonish, and fully legible.",
  "The final image should resemble a classic colouring book page.",
].join(" ");

export const SUBJECT_FRAMING =
  "The subject should be centred and fill the page. Friendly, age-appropriate cartoon illustration suitable for printing.";

export function buildStylePrompt(ageRange: AgeRange): string {
  const complexity = AGE_COMPLEXITY[ageRange];
  return `${STYLE_INSTRUCTIONS} Age range: ${ageRange}. ${complexity}.`;
}

export function buildSystemPrompt(
  userPrompt: string,
  ageRange: AgeRange
): string {
  return `${buildStylePrompt(ageRange)} Subject: ${userPrompt} ${SUBJECT_FRAMING}`;
}
