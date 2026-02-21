"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TemplateVar {
  name: string;
  placeholder: string;
  options?: string[];
}

interface Template {
  id: string;
  category: string;
  name: string;
  promptTemplate: string;
  variablesJson: string | null;
  ageRange: string;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "animals", label: "Animals" },
  { value: "space", label: "Space" },
  { value: "fantasy", label: "Fantasy" },
  { value: "vehicles", label: "Vehicles" },
  { value: "nature", label: "Nature" },
];

const CATEGORY_COLORS: Record<string, { pill: string; border: string }> = {
  animals: { pill: "bg-accent/20 text-accent-foreground", border: "oklch(0.88 0.14 142)" },
  space: { pill: "bg-primary/15 text-primary", border: "oklch(0.55 0.22 264)" },
  fantasy: { pill: "bg-chart-4/15 text-chart-4", border: "oklch(0.68 0.20 350)" },
  vehicles: { pill: "bg-chart-1/15 text-chart-1", border: "oklch(0.62 0.24 28)" },
  nature: { pill: "bg-chart-2/15 text-chart-2", border: "oklch(0.72 0.18 142)" },
};

export function TemplateBrowser() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = category ? `?category=${category}` : "";
    fetch(`/api/templates${params}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setTemplates(data.items))
      .finally(() => setIsLoading(false));
  }, [category]);

  const useTemplate = (template: Template) => {
    let prompt = template.promptTemplate;

    // Fill in variables with first option or placeholder
    if (template.variablesJson) {
      const vars: TemplateVar[] = JSON.parse(template.variablesJson);
      for (const v of vars) {
        const value = v.options?.[0] ?? v.placeholder;
        prompt = prompt.replace(`{${v.name}}`, value);
      }
    }

    // Navigate to home page with prompt as query param
    router.push(`/?prompt=${encodeURIComponent(prompt)}&ageRange=${template.ageRange}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const colors = CATEGORY_COLORS[cat.value];
          const isActive = category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? colors?.pill ?? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <span className="text-5xl">{"\uD83D\uDCDD"}</span>
          <h3 className="font-display text-xl font-bold text-foreground">
            No templates found
          </h3>
          <p className="text-muted-foreground">
            Try a different category or check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {templates.map((template) => {
            const catColor = CATEGORY_COLORS[template.category];
            return (
              <Card
                key={template.id}
                className="p-4 space-y-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: catColor?.border ?? "var(--border)",
                }}
              >
                <div>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {template.category} &middot; Ages {template.ageRange}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.promptTemplate}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => useTemplate(template)}
                >
                  Use Template
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
