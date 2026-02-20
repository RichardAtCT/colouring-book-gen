import { TemplateBrowser } from "@/components/TemplateBrowser";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
        <p className="text-muted-foreground">
          Browse pre-built prompt templates for quick colouring page generation.
        </p>
      </div>
      <TemplateBrowser />
    </div>
  );
}
