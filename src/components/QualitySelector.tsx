"use client";

import type { QualityTier } from "@/types";
import { cn } from "@/lib/utils";

const QUALITY_OPTIONS: {
  value: QualityTier;
  label: string;
  description: string;
}[] = [
  { value: "low", label: "Low", description: "Quick draft" },
  { value: "medium", label: "Medium", description: "Balanced" },
  { value: "high", label: "High", description: "Best quality" },
];

interface QualitySelectorProps {
  value: QualityTier;
  onChange: (value: QualityTier) => void;
  disabled?: boolean;
}

export function QualitySelector({
  value,
  onChange,
  disabled,
}: QualitySelectorProps) {
  return (
    <div className="flex gap-2">
      {QUALITY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-lg border-2 px-3 py-2 text-sm transition-colors",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "border-primary bg-primary/5 text-primary"
              : "border-border text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="font-medium">{option.label}</div>
          <div className="text-xs opacity-70">{option.description}</div>
        </button>
      ))}
    </div>
  );
}
