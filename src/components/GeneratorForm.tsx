"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgeRangeSelector } from "@/components/AgeRangeSelector";
import { ImagePreview } from "@/components/ImagePreview";
import type { AgeRange, GenerateResponse, GenerateError } from "@/types";

const MAX_PROMPT_LENGTH = 500;

export function GeneratorForm() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";
  const initialAgeRange = (searchParams.get("ageRange") ?? "5-7") as AgeRange;

  const [prompt, setPrompt] = useState(initialPrompt);
  const [ageRange, setAgeRange] = useState<AgeRange>(initialAgeRange);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = prompt.trim().length >= 3 && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), ageRange, quality: "low" }),
      });

      const data: GenerateResponse | GenerateError = await response.json();

      if (!response.ok) {
        setError((data as GenerateError).error);
        return;
      }

      setImageUrl((data as GenerateResponse).imageUrl);
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

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating...
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
    </form>
  );
}
