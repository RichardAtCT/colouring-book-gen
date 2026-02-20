interface ModelPricing {
  inputPerMillion: number;
  cachedInputPerMillion: number;
  outputPerMillion: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

const IMAGE_MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-image-1.5": {
    inputPerMillion: 5.0,
    cachedInputPerMillion: 1.25,
    outputPerMillion: 10.0,
  },
  "gpt-image-1": {
    inputPerMillion: 5.0,
    cachedInputPerMillion: 1.25,
    outputPerMillion: 0,
  },
  "gpt-image-1-mini": {
    inputPerMillion: 2.0,
    cachedInputPerMillion: 0.2,
    outputPerMillion: 0,
  },
};

const CHAT_MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": {
    inputPerMillion: 0.15,
    cachedInputPerMillion: 0.075,
    outputPerMillion: 0.6,
  },
};

export function calculateImageCost(model: string, usage: TokenUsage): number {
  const pricing = IMAGE_MODEL_PRICING[model];
  if (!pricing) return 0;

  return (
    (usage.inputTokens * pricing.inputPerMillion) / 1_000_000 +
    (usage.outputTokens * pricing.outputPerMillion) / 1_000_000
  );
}

export function formatCost(cost: number): string {
  if (cost < 1) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function calculateChatCost(
  model: string,
  usage: { prompt_tokens: number; completion_tokens: number }
): number {
  const pricing = CHAT_MODEL_PRICING[model];
  if (!pricing) return 0;

  return (
    (usage.prompt_tokens * pricing.inputPerMillion) / 1_000_000 +
    (usage.completion_tokens * pricing.outputPerMillion) / 1_000_000
  );
}
