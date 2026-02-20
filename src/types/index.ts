export type AgeRange = "2-4" | "5-7" | "8-12";

export type QualityTier = "low" | "medium" | "high";

export interface GenerateRequest {
  prompt: string;
  ageRange: AgeRange;
  quality: QualityTier;
}

export interface GenerateResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  ageRange: AgeRange;
  quality: QualityTier;
  costUsd: number;
  durationMs: number;
  createdAt: string;
}

export interface GenerateError {
  error: string;
  code: "RATE_LIMIT" | "INVALID_INPUT" | "GENERATION_FAILED" | "SERVER_ERROR";
}

export interface BookPagePrompt {
  id: string;
  pageNumber: number;
  title: string;
  prompt: string;
}

export type PageGenerationStatus = "pending" | "generating" | "done" | "failed";

export interface BookPageGenerationState {
  id: string;
  pageNumber: number;
  title: string;
  prompt: string;
  status: PageGenerationStatus;
  generationId?: string;
  imageUrl?: string;
  error?: string;
  costUsd?: number;
}

export interface BookCoverState {
  id: string;
  title: string;
  prompt: string;
  status: PageGenerationStatus;
  generationId?: string;
  imageUrl?: string;
  error?: string;
  costUsd?: number;
}
