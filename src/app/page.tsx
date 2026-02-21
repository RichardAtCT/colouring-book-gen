import { Suspense } from "react";
import Link from "next/link";
import { GeneratorForm } from "@/components/GeneratorForm";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 px-6 py-10 sm:px-10 sm:py-14">
        {/* Decorative dots */}
        <div className="absolute top-4 left-6 h-3 w-3 rounded-full bg-chart-1/40" />
        <div className="absolute top-8 right-10 h-2 w-2 rounded-full bg-chart-4/40" />
        <div className="absolute bottom-6 left-1/4 h-2.5 w-2.5 rounded-full bg-accent/40" />
        <div className="absolute bottom-4 right-1/3 h-2 w-2 rounded-full bg-primary/30" />

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-primary via-chart-4 to-accent bg-clip-text text-transparent">
            Make Your Own Colouring Pages!
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
          Describe a scene and we&apos;ll generate print-ready colouring pages
          with clean line art.{" "}
          <Link
            href="/templates"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Or try a template
          </Link>
        </p>
      </div>

      <Suspense>
        <GeneratorForm />
      </Suspense>
    </div>
  );
}
