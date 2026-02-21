import { Suspense } from "react";
import { PromptLab } from "@/components/PromptLab";

export default function PromptLabPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Prompt Lab</h2>
        <p className="text-muted-foreground">
          Compare prompt variants side-by-side to fine-tune generation quality.
          Edit the templates below and generate both to see the difference.
        </p>
      </div>
      <Suspense>
        <PromptLab />
      </Suspense>
    </div>
  );
}
