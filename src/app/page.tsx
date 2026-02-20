import { GeneratorForm } from "@/components/GeneratorForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          Create a Colouring Page
        </h2>
        <p className="text-muted-foreground">
          Describe a scene and we&apos;ll generate a print-ready colouring page
          with clean line art.
        </p>
      </div>
      <GeneratorForm />
    </div>
  );
}
