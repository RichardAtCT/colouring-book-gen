"use client";

import { useState, useEffect } from "react";
import type { Provider } from "@/lib/generate-image";

let cachedProviders: Provider[] | null = null;

export function useAvailableProviders() {
  const [providers, setProviders] = useState<Provider[]>(
    cachedProviders ?? []
  );
  const [isLoading, setIsLoading] = useState(cachedProviders === null);

  useEffect(() => {
    if (cachedProviders !== null) return;

    fetch("/api/providers")
      .then((r) => r.json())
      .then((data: { providers: Provider[] }) => {
        cachedProviders = data.providers;
        setProviders(data.providers);
      })
      .catch(() => {
        // If the endpoint fails, assume both are available so the user
        // can still attempt generation (they'll get an error at that point).
        cachedProviders = ["openai", "gemini"];
        setProviders(["openai", "gemini"]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { providers, isLoading };
}
