import { Suspense } from "react";
import { CompareForm } from "@/components/CompareForm";

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Quality Comparison
        </h2>
        <p className="text-muted-foreground">
          Generate the same scene at all three quality tiers to compare output,
          cost, and speed.
        </p>
      </div>
      <Suspense>
        <CompareForm />
      </Suspense>
    </div>
  );
}
