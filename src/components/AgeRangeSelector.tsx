"use client";

import type { AgeRange } from "@/types";
import { cn } from "@/lib/utils";

const AGE_OPTIONS: { value: AgeRange; label: string; description: string }[] = [
  { value: "2-4", label: "Ages 2-4", description: "Simple & bold" },
  { value: "5-7", label: "Ages 5-7", description: "Moderate detail" },
  { value: "8-12", label: "Ages 8-12", description: "Detailed" },
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
