"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgeRangeSelector } from "@/components/AgeRangeSelector";
import { formatCost } from "@/lib/costs";
import { useAvailableProviders } from "@/hooks/use-available-providers";
import type { AgeRange, QualityTier } from "@/types";

const MAX_PROMPT_LENGTH = 500;

const TIERS: { quality: QualityTier; label: string; model: string }[] = [
  { quality: "low", label: "Low", model: "gpt-image-1-mini" },
  { quality: "medium", label: "Medium", model: "gpt-image-1" },
  { quality: "high", label: "High", model: "gpt-image-1.5" },
];

type TierResult = {
  status: "idle" | "loading" | "done" | "error";
  imageUrl?: string;
  costUsd?: number;
  durationMs?: number;
  error?: string;
};

const INITIAL_RESULTS: Record<QualityTier, TierResult> = {
  low: { status: "idle" },
  medium: { status: "idle" },
  high: { status: "idle" },
};

export function CompareForm() {
  const [prompt, setPrompt] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange>("5-7");
  const [results, setResults] =
    useState<Record<QualityTier, TierResult>>(INITIAL_RESULTS);
  const { providers, isLoading: providersLoading } = useAvailableProviders();
  const openaiAvailable = providers.includes("openai");

  const isLoading = Object.values(results).some((r) => r.status === "loading");
  const canSubmit = prompt.trim().length >= 3 && !isLoading && openaiAvailable;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const newResults: Record<QualityTier, TierResult> = {
      low: { status: "loading" },
      medium: { status: "loading" },
      high: { status: "loading" },
    };
    setResults(newResults);

    for (const tier of TIERS) {
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ageRange,
          quality: tier.quality,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Generation failed (${r.status})`);
          return r.json();
        })
        .then((data) =>
          setResults((prev) => ({
            ...prev,
            [tier.quality]: {
              status: "done",
              imageUrl: data.imageUrl,
              costUsd: data.costUsd,
              durationMs: data.durationMs,
            },
          }))
        )
        .catch((err) =>
          setResults((prev) => ({
            ...prev,
            [tier.quality]: { status: "error", error: err.message },
          }))
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="compare-prompt" className="text-sm font-medium">
          Describe your colouring page
        </label>
        <Textarea
          id="compare-prompt"
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

      {!providersLoading && !openaiAvailable && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          Quality comparison requires an OpenAI API key. Set OPENAI_API_KEY in your environment.
        </div>
      )}

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? "Generating 3 images..." : "Compare All Qualities"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        This will use 3 generations from your quota
      </p>

      <div className="space-y-4">
        {TIERS.map((tier) => {
          const result = results[tier.quality];
          if (result.status === "idle") return null;

          return (
            <Card key={tier.quality} className="overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-2">
                <div>
                  <span className="font-semibold">{tier.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {tier.model}
                  </span>
                </div>
                {result.status === "done" && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {result.durationMs != null && (
                      <span>{(result.durationMs / 1000).toFixed(1)}s</span>
                    )}
                    {result.costUsd != null && (
                      <span>{formatCost(result.costUsd)}</span>
                    )}
                  </div>
                )}
              </div>

              {result.status === "loading" && (
                <div className="flex aspect-square items-center justify-center p-4">
                  <Skeleton className="h-64 w-64 rounded-lg" />
                </div>
              )}

              {result.status === "done" && result.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.imageUrl}
                  alt={`${tier.label} quality result`}
                  className="w-full"
                />
              )}

              {result.status === "error" && (
                <div className="p-4 text-sm text-destructive">
                  {result.error ?? "Generation failed"}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </form>
  );
}
