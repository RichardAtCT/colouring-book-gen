"use client";

import type { AgeRange } from "@/types";
import { cn } from "@/lib/utils";

const AGE_OPTIONS: { value: AgeRange; label: string; description: string; emoji: string }[] = [
  { value: "2-4", label: "Ages 2-4", description: "Simple & bold", emoji: "\u2B50" },
  { value: "5-7", label: "Ages 5-7", description: "Moderate detail", emoji: "\uD83C\uDFA8" },
  { value: "8-12", label: "Ages 8-12", description: "Detailed", emoji: "\u270F\uFE0F" },
];

interface AgeRangeSelectorProps {
  value: AgeRange;
  onChange: (value: AgeRange) => void;
  disabled?: boolean;
}

export function AgeRangeSelector({
  value,
  onChange,
  disabled,
}: AgeRangeSelectorProps) {
  return (
    <div className="flex gap-2">
      {AGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-xl border-2 px-3 py-2 text-sm transition-all",
            "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "border-primary bg-primary/5 text-primary shadow-sm"
              : "border-border text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="font-medium">
            <span className="mr-1">{option.emoji}</span>
            {option.label}
          </div>
          <div className="text-xs opacity-70">{option.description}</div>
        </button>
      ))}
    </div>
  );
}
