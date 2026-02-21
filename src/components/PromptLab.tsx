"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgeRangeSelector } from "@/components/AgeRangeSelector";
import { formatCost } from "@/lib/costs";
import { useAvailableProviders } from "@/hooks/use-available-providers";
import {
  STYLE_INSTRUCTIONS,
  AGE_COMPLEXITY,
  SUBJECT_FRAMING,
} from "@/lib/prompts";
import type { AgeRange, QualityTier } from "@/types";
import type { Provider } from "@/lib/generate-image";

const MAX_PROMPT_LENGTH = 500;

function getDefaultTemplate(ageRange: AgeRange): string {
  const complexity = AGE_COMPLEXITY[ageRange];
  return `${STYLE_INSTRUCTIONS} Age range: ${ageRange}. ${complexity}. {{SUBJECT}} ${SUBJECT_FRAMING}`;
}

type VariantResult = {
  status: "idle" | "loading" | "done" | "error";
  imageUrl?: string;
  costUsd?: number;
  durationMs?: number;
  error?: string;
  fullPrompt?: string;
};

export function PromptLab() {
  const [userPrompt, setUserPrompt] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange>("5-7");
  const [quality, setQuality] = useState<QualityTier>("low");
  const [provider, setProvider] = useState<Provider>("openai");
  const { providers, isLoading: providersLoading } = useAvailableProviders();

  const [templateA, setTemplateA] = useState(() => getDefaultTemplate("5-7"));
  const [templateB, setTemplateB] = useState(() => getDefaultTemplate("5-7"));
  const [resultA, setResultA] = useState<VariantResult>({ status: "idle" });
  const [resultB, setResultB] = useState<VariantResult>({ status: "idle" });

  // Update templates when age range changes (only the age-specific parts)
  const handleAgeChange = (newAge: AgeRange) => {
    setAgeRange(newAge);
    setTemplateA(getDefaultTemplate(newAge));
    setTemplateB(getDefaultTemplate(newAge));
  };

  const isLoading =
    resultA.status === "loading" || resultB.status === "loading";
  const canSubmit =
    userPrompt.trim().length >= 3 &&
    !isLoading &&
    !providersLoading &&
    providers.includes(provider);

  function assemblePrompt(template: string, subject: string): string {
    return template.replace("{{SUBJECT}}", `Subject: ${subject}`);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const subject = userPrompt.trim();
    const promptA = assemblePrompt(templateA, subject);
    const promptB = assemblePrompt(templateB, subject);

    setResultA({ status: "loading", fullPrompt: promptA });
    setResultB({ status: "loading", fullPrompt: promptB });

    const generate = (
      fullPrompt: string,
      setResult: (r: VariantResult) => void
    ) => {
      fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: subject,
          ageRange,
          quality,
          provider,
          systemPromptOverride: fullPrompt,
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Generation failed (${r.status})`);
          return r.json();
        })
        .then((data) =>
          setResult({
            status: "done",
            imageUrl: data.imageUrl,
            costUsd: data.costUsd,
            durationMs: data.durationMs,
            fullPrompt,
          })
        )
        .catch((err) =>
          setResult({ status: "error", error: err.message, fullPrompt })
        );
    };

    generate(promptA, setResultA);
    generate(promptB, setResultB);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shared controls */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="lab-prompt" className="text-sm font-medium">
            Test subject
          </label>
          <Textarea
            id="lab-prompt"
            value={userPrompt}
            onChange={(e) =>
              setUserPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))
            }
            placeholder="A friendly dinosaur reading a book in a cosy library..."
            rows={2}
            disabled={isLoading}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {userPrompt.length}/{MAX_PROMPT_LENGTH}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Age range</label>
          <AgeRangeSelector
            value={ageRange}
            onChange={handleAgeChange}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quality</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as QualityTier[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setQuality(q)}
                  className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                    quality === q
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {q.charAt(0).toUpperCase() + q.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {!providersLoading && providers.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <div className="flex gap-2">
                {providers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setProvider(p)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                      provider === p
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {p === "openai" ? "OpenAI" : "Gemini"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side prompt editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="template-a" className="text-sm font-medium">
            Variant A (Control)
          </label>
          <Textarea
            id="template-a"
            value={templateA}
            onChange={(e) => setTemplateA(e.target.value)}
            rows={8}
            disabled={isLoading}
            className="resize-none font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="template-b" className="text-sm font-medium">
            Variant B (Experiment)
          </label>
          <Textarea
            id="template-b"
            value={templateB}
            onChange={(e) => setTemplateB(e.target.value)}
            rows={8}
            disabled={isLoading}
            className="resize-none font-mono text-xs"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Use <code className="bg-muted px-1 rounded">{"{{SUBJECT}}"}</code> as a
        placeholder for where the user&apos;s subject description gets inserted.
      </p>

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? "Generating 2 variants..." : "Compare Variants"}
      </Button>

      {/* Side-by-side results */}
      {(resultA.status !== "idle" || resultB.status !== "idle") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VariantCard label="A" result={resultA} />
          <VariantCard label="B" result={resultB} />
        </div>
      )}
    </form>
  );
}

function VariantCard({
  label,
  result,
}: {
  label: string;
  result: VariantResult;
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-semibold">Variant {label}</span>
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
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.imageUrl}
            alt={`Variant ${label} result`}
            className="w-full"
          />
          {result.fullPrompt && (
            <div className="border-t px-4 py-2">
              <button
                type="button"
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPrompt ? "Hide" : "Show"} full prompt
              </button>
              {showPrompt && (
                <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted p-2 rounded max-h-48 overflow-y-auto">
                  {result.fullPrompt}
                </pre>
              )}
            </div>
          )}
        </>
      )}

      {result.status === "error" && (
        <div className="p-4 text-sm text-destructive">
          {result.error ?? "Generation failed"}
        </div>
      )}
    </Card>
  );
}
