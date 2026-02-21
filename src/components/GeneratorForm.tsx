"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgeRangeSelector } from "@/components/AgeRangeSelector";
import { QualitySelector } from "@/components/QualitySelector";
import { ImagePreview } from "@/components/ImagePreview";
import { Spinner } from "@/components/Spinner";
import { formatCost } from "@/lib/costs";
import { useAvailableProviders } from "@/hooks/use-available-providers";
import type { AgeRange, QualityTier, GenerateResponse, GenerateError } from "@/types";
import type { Provider } from "@/lib/generate-image";

const MAX_PROMPT_LENGTH = 500;

export function GeneratorForm() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";
  const initialAgeRange = (searchParams.get("ageRange") ?? "5-7") as AgeRange;

  const [prompt, setPrompt] = useState(initialPrompt);
  const [ageRange, setAgeRange] = useState<AgeRange>(initialAgeRange);
  const [quality, setQuality] = useState<QualityTier>("low");
  const { providers, isLoading: providersLoading } = useAvailableProviders();
  const [provider, setProvider] = useState<Provider>("openai");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select first available provider once loaded
  useEffect(() => {
    if (providers.length > 0 && !providers.includes(provider)) {
      setProvider(providers[0]);
    }
  }, [providers, provider]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [costUsd, setCostUsd] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = prompt.trim().length >= 3 && !isLoading && !providersLoading && providers.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    setCostUsd(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), ageRange, quality, provider }),
      });

      const data: GenerateResponse | GenerateError = await response.json();

      if (!response.ok) {
        setError((data as GenerateError).error);
        return;
      }

      const result = data as GenerateResponse;
      setImageUrl(result.imageUrl);
      setCostUsd(result.costUsd);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="prompt" className="text-sm font-medium">
          Describe your colouring page
        </label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          placeholder="A friendly dinosaur reading a book in a cosy library..."
          rows={3}
          disabled={isLoading}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Age range</label>
        <AgeRangeSelector
          value={ageRange}
          onChange={setAgeRange}
          disabled={isLoading}
        />
      </div>

      {providersLoading ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </div>
      ) : providers.length === 0 ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          No API keys configured. Set OPENAI_API_KEY or GEMINI_API_KEY in your environment.
        </div>
      ) : providers.length === 1 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <div className="rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
            {providers[0] === "openai" ? "OpenAI" : "Gemini"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <div className="flex gap-2">
            {providers.includes("openai") && (
              <button
                type="button"
                onClick={() => setProvider("openai")}
                disabled={isLoading}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  provider === "openai"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                } disabled:opacity-50`}
              >
                OpenAI
              </button>
            )}
            {providers.includes("gemini") && (
              <button
                type="button"
                onClick={() => setProvider("gemini")}
                disabled={isLoading}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  provider === "gemini"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                } disabled:opacity-50`}
              >
                Gemini
              </button>
            )}
          </div>
        </div>
      )}

      {provider === "openai" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Quality</label>
          <QualitySelector
            value={quality}
            onChange={setQuality}
            disabled={isLoading}
          />
        </div>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Drawing...
          </span>
        ) : (
          "Generate Colouring Page"
        )}
      </Button>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <ImagePreview imageUrl={imageUrl} isLoading={isLoading} />
      {costUsd != null && imageUrl && (
        <p className="text-xs text-muted-foreground text-center">
          Cost: {formatCost(costUsd)}
        </p>
      )}
    </form>
  );
}
