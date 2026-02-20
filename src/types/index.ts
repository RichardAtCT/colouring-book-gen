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
  createdAt: string;
}

export interface GenerateError {
  error: string;
  code: "RATE_LIMIT" | "INVALID_INPUT" | "GENERATION_FAILED" | "SERVER_ERROR";
}
