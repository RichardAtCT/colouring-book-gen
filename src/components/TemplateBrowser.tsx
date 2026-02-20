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
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="p-4 space-y-3">
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
          ))}
        </div>
      )}
    </div>
  );
}
